---
layout: post
title:  "Big-Data Work-Flow with MongoDB"
date:   2015-07-14 02:00:00 EDT
categories: ["big data", "Python", "MongoDB"]
cover: /assets/images/MongoDB-workflow.jpg
---

For [my current project](/big%20data/graphs/community%20detection/market%20segmentation/2015/07/07/communities-and-markets.html), I need to be able to routinely handle tens of gigabytes of data. After a failed attempt to create a convenient work-flow with [HDF5](https://www.hdfgroup.org/HDF5/) on a single machine, I decided to store everything in a MongoDB database on my server and to have my desktop retrieving only the data that I need. I'm happy to report that I have finally concocted a system that works. <span class="more"></span>

Let me demonstrate with an example. Currently, I am working with the [Acquire Valued Shoppers Challenge](https://www.kaggle.com/c/acquire-valued-shoppers-challenge) data from Kaggle. This data comes in five gzipped CSV files, the interesting one being `transactions.csv`. This file contains one year of purchase transaction history for $311,452$ different consumers. It is over $20 \mathrm{GB}$ in size. Each transaction record consists of eleven fields listed in the following table:

| field            | description                            |
| ----------------:|:-------------------------------------- |
| id               | unique id representing a consumer      |
| chain            | integer representing a store chain     |
| dept             | aggregate groupings of item categories |
| category         | id of the item's category              |
| company          | id of the company selling the item     |
| brand            | id of the brand the item belongs to    |
| date             | purchase date                          |
| productsize      | amount of the item purchase            |
| productmeasure   | unit the amount is measured in         |
| purchasequantity | number of units purchased              |
| purchaseamount   | dollar amount of the purchase          |

## Copying to MongoDB

My first task was to load that file and store its contents in MongoDB. I wrote a little Python script that does exactly that. It is shown below.

*Note that this and all following code examples have been edited for length and clarity. There is no error handling, no logging, and no user feedback.*

```python
# -*- coding: utf-8 -*-

import pandas as pd
import json
from pymongo import MongoClient

settings = {
        'mongo_host': 'server.local',
        'mongo_db_name': 'mydb',
        'mongo_port': 27017,
        'chunk_size': 100000,
        'drop_collections_on_load': True,
        'transactions_collection': 'transactions',
        'transactions_source_csv_gz': 'transactions.csv.gz'
    }

def to_mongo(dest, data, idxs=[]):
    if (settings['drop_collections_on_load']):
        dest.drop()
    for chunk in data:
        dest.insert(json.loads(chunk.to_json(orient='records')))
    for idx in idxs:
        dest.ensure_index(idx)

if __name__ == "__main__":
    # establish connection:
    mongo_client = MongoClient(settings['mongo_host'],
                               settings['mongo_port'])
    mongo_db = mongo_client[settings['mongo_db_name']]

    # load data:
    transactions = pd.read_csv(
        settings['transactions_source_csv_gz'],
        parse_dates=['date'],
        compression='gzip',
        chunksize=settings['chunk_size'])
    # insert data:
    to_mongo(mongo_db[settings['transactions_collection']],
             transactions,
             ['id', 'brand', 'category', 'company', 'date'])

    # close connection:
    mongo_client.close()
```

With this script, I can copy all data in `transactions.csv` to a MongoDB collection called `transactions` using the PyMongo driver. Any preexisting collection with that name is wiped. The script is divided into three major tasks:

First, I use Pandas to parse the CSV file and to load its contents chunk by chunk into an ordered data structure, in this case, a Pandas `DataFrame`. To this end, Pandas first divides the file into read chunks of a $100,000$ rows each. Pandas then returns an iterator on the chunks and only reads the data when requested. That reduces the memory consumption significantly, compared with reading the file as a whole. A `DataFrame` with all of the file's contents would barely fit in RAM.

Then, I pass the Pandas iterator to the `to_mongo` function. There, it is iterated over. PyMongo doesn't know what to do with a `DataFrame` object. It only understands Python's `dict` objects. To get around this limitation, I use Pandas' `to_json` method to first convert the chunk to a JSON string and then `json.loads` to de-serialize that string to a `dict` object that PyMongo gladly accepts. `insert` inserts the chunk into the `transactions` collection.

Finally, after all data has been copied, I create several single field indexes in the `transactions` collection, specifically, for the fields `id`, `brand`, `category`, `company`, and `date`. The script exits after closing the connection to the database.

## Creating specialized data collections

The `transactions` collection contains a lot of information, not all of which is constantly in need. Since every bit of additional information equals more waiting, it makes sense to create a couple of thinned out collections that are tailored to specific use cases. I have picked one of my use cases to illustrate this process.

Currently, [I am studying graphs](/big%20data/graphs/community%20detection/market%20segmentation/2015/07/07/communities-and-markets.html#MarketSegmentationAndRecommendationSystems) that represent the relationship between the consumers and the items in the dataset. These relationships are solely inferred from aggregated transaction data. Since the original `transactions` collection contains atomic transaction data, I decided to create another collection, `graph`, populated just with aggregated data. For that purpose, I wrote the following Python script:

```python
# -*- coding: utf-8 -*-

import pandas as pd
from pymongo import MongoClient

settings = {
        'mongo_host': 'server.local',
        'mongo_db_name': 'mydb',
        'mongo_port': 27017,
        'drop_collections_on_load': True,
        'transactions_collection': 'transactions',
        'graph_collection': 'graph'
    }

if __name__ == "__main__":
    # establish connection:
    mongo_client = MongoClient(settings['mongo_host'],
                               settings['mongo_port'])
    mongo_db = mongo_client[settings['mongo_db_name']]

    # get collections:
    transactions_collection = mongo_db[settings['transactions_collection']]
    graph_collection = mongo_db[settings['graph_collection']]
    if (settings['drop_collections_on_load']):
        graph_collection.drop()

    # query items:
    pipeline = [
            {"$group": {
                "_id": {
                    "brand": "$brand",
                    "company": "$company",
                    "category": "$category"
                }
            }},
            {"$project": {
                "_id": False,
                "brand": "$_id.brand",
                "company": "$_id.company",
                "category": "$_id.category"
            }}
        ]
    cursor = transactions_collection.aggregate(pipeline,
                                               allowDiskUse=True)
    items = pd.DataFrame(list(cursor))
    items.index.name = "item"
    items = items.reset_index(level=0)
    items = items.set_index(['brand',
                             'company',
                             'category'])

    # for each consumer and item, aggregate purchases and returns:
    pipeline = [
            {"$group": {
                "_id": {
                    "consumer": "$id",
                    "brand": "$brand",
                    "company": "$company",
                    "category": "$category"
                },
                "dept": {"$first": "$dept"},
                "transactioncount": {"$sum": 1},
                "purchasecount": {"$sum": {
                    "$cond": [
                        {"$and": [
                            {"$gt": [
                                "$purchasequantity",
                                0
                            ]},
                            {"$gt": [
                                "$purchaseamount",
                                0
                            ]}
                        ]},
                        "$purchasequantity",
                        0
                    ]
                }},
                "returncount": {"$sum": {
                    "$cond": [
                        {"$or": [
                            {"$lt": [
                                "$purchasequantity",
                                0
                            ]},
                            {"$lt": [
                                "$purchaseamount",
                                0
                            ]}
                        ]},
                        {"$cond": [
                            {"$lt": [
                                "$purchasequantity",
                                0
                            ]},
                            {"$subtract": [
                                0,
                                "$purchasequantity"
                            ]},
                            "$purchasequantity"
                        ]},
                        0
                    ]
                }}
            }},
            {"$project": {
                "_id": False,
                "consumer": "$_id.consumer",
                "brand": "$_id.brand",
                "company": "$_id.company",
                "category": "$_id.category",
                "dept": True,
                "transactioncount": True,
                "purchasecount": True,
                "returncount": True
            }}
        ]
    cursor = transactions_collection.aggregate(pipeline,
                                               allowDiskUse=True)
    # process records:
    for record in cursor:
        record['item'] = items.loc[
            (record['brand'],
             record['company'],
             record['category']),
            'item']
        # insert data:
        _ = graph_collection.insert(record)

    # create indexes:
    graph_collection.create_index(
        [('consumer', pymongo.ASCENDING)],
        background=True)
    graph_collection.create_index(
        [('item', pymongo.ASCENDING)],
        background=True)
    graph_collection.create_index(
        [('brand', pymongo.ASCENDING),
         ('company', pymongo.ASCENDING),
         ('category', pymongo.ASCENDING)],
        background=True)

    # close connection
    mongo_client.close()
```

Here is how it works:

After opening a connection to the database, the script starts to query all individual items that occur in the `transactions` collection. In particular, it first retrieves all items from MongoDB, then counts, and eventually stores them in a `MultiIndex`-ed Pandas `DataFrame` called `items`. The count plays the role of an item id. Later, this id is added as a field to the `graph` collection.

This sounds strange, but there is a reason for it. As apparent from the table above, the original dataset does not feature anything resembling an "item" field. That means that there is no data that directly identifies the items that have been purchased by the consumers -- we only know that each row in the dataset is associated with the purchase of one particular item (or multiples thereof), but not of which one. Yet, we have information that is almost as good as an "item" field. We have the ids of the purchased item's brand, its manufacturer, and its category within the store. I define an item as a unique combination of those fields, i.e. of the values of `brand`, `company`, and `category`. Of course, with this I turned a blind eye to the fact that the very same item can come in different sizes, flavors, and with different traits. Information about flavors and traits is not available, but, in principle, size information could have been extracted from the `productsize` and `productmeasure` fields. I decided against using that data. 

<p>
  <figure>
    <img src="/assets/images/hydrogen.png" title="Hydrogen">
  </figure>
  <figcaption>Output of the above script as it appears in the Atom editor. The small overlay window shows a dump of the <code>items</code> object formatted as a table.</figcaption>
</p>

Next in the script is the aggregation job. The data processing pipeline for the aggregation is long, but quite straight-forward (it's the second list of dictionaries assigned to the `pipeline` variable). Let me go through it step by step. First I group all documents by the fields `id`, `brand`, `company`, and `category` (as specified by the `_id` field). For each group, MongoDB sums up

- the total number of transactions,
- the total number of purchases, and
- the absolute total number returns (some counts are negative as explained below).

MongoDB also collects the `dept` field, whose values are nothing but coarse-grained versions of the `category` taxonomy (see the table above). The last step, the projection step, is a decision between which fields to return and which to dismiss.

There is a bit of logic involved in the detection of purchases and returns that begs an explanation. In the script, a transaction becomes a purchase if the values of both the `purchasequantity` and the `purchaseamount` fields are positive. It becomes a return if either value is negative. I made this distinction a little fuzzy because I found that returns are marked *inconsistently* in the original dataset. I found out about this when I iterated whether `purchasequantity` or `purchaseamount` on their own could be used to identify an item return. This is what happened:

###### Using only `purchasequantity`

Naive as I was, I first said that a transaction had to be a return if `purchasequantity` was negative. If this were correct, then, in these cases, one would expect `purchaseamount` also to be negative, because the price of an item should always be positive. I found that this can be observed for $267,968$ transactions. However, there are some transaction ($5,080$ to be exact), for which `purchasequantity` $< 0$ and `purchaseamount` $> 0$. There are also $800$ cases where `purchaseamount` is zero. I therefore had to accept that the sign of `purchasequantity` is not a good indicator for when an item is being returned.

###### Using only `purchaseamount`

I then studied the `purchaseamount` field. Could it be a better indicator? Unfortunately, it's not good either, it's actually worse. I found $35,886$ cases for which `purchaseamount` $< 0$ and `purchasequantity` $= 0$. And, there are $7,811,148$ cases where `purchaseamount` $< 0$ and `purchasequantity` $> 0$. If one were to take this literally, it means that someone bought an item and was *paid* the item's price by the store. These must be errors. Maybe it was a return and `purchasequantity` was meant to be negative as well, but for some reason was not. We'll never know.

###### Using both `purchasequantity` and `purchaseamount`

I concluded that the best criterion for when it was a return is to look for instances in which `purchasequantity` $< 0$ *or* `purchaseamount` $< 0$ (a nonexclusive or). In the MongoDB console, this could look like: 

```javascript
db.transactions.find( { $or: [ { purchasequantity: { $lt: 0 } }, { purchaseamount: { $lt: 0 } } ] } )
```

That command returns $8,120,882$ transactions. As you can see from the code above, this filter is what I ended up using.

Now back to the code, particularly, the line in which `pipeline` is passed to PyMongo's `aggregate` method. `aggregate` returns a database cursor that iterates over the results of the query. For each record provided by the cursor, the script looks up the item id associated with values of the record's `brand`, `company`, and `category` fields. This is what the `items` object was for. The retrieved id is added to the record; this updated record is then inserted into the `graph` collection.

Once the `for` loop is finished looping through the records, a couple of indexes are created. Here, I let PyMongo create two single-field indexes, one for `consumer` and one for `item`, and one compound compound index. This compound index holds references to the fields `brand`, `company`, and `category`. Once index build has been initiated, the script closes the connection and exits.

## A final word

Let me conclude with a comment regarding the role of the `graph` collection in [my current project](/big%20data/graphs/community%20detection/market%20segmentation/2015/07/07/communities-and-markets.html). Please have a look at the following table:

| field            | description                            | representation |
| ----------------:|:-------------------------------------- |:-------------- |
| consumer         | unique id representing a consumer      | vertex         |
| item             | unique id representing an item         | vertex         |
| dept             | aggregate groupings of item categories | label          |
| category         | id of the item's category              | label          |
| company          | id of the company selling the item     | label          |
| brand            | id of the brand the item belongs to    | label          |
| transactioncount | total number of transactions           | edge           |
| purchasecount    | total number of purchases              | edge           |
| returncount      | total number of returns                | edge           |

This is a list of the fields in the `graph` collection as created by my script. Recall that, in [my original post](/big%20data/graphs/community%20detection/market%20segmentation/2015/07/07/communities-and-markets.html#MarketSegmentationAndRecommendationSystems), I defined the *consumer-item graph* as the bipartite graph in which the consumers and the items appear as vertices and in which the purchases are represented by integer-weighted edges. From a look at the table of fields, it is apparent that the `graph` collection stores not only the full consumer-item graph, it also has information about the department, the category, the company, and the brand of each item. In the graph, this information can be represented as labels of the item vertices.

The `graph` collection also stores the number of item returns and the total transaction count. Note that `transactioncount` is not just equal to the sum of `purchasecount` and `returncount` -- it is equal or less (it's the number of records in the `transactions` collection in which a consumer and an item occur together). Since the three counts are independent quantities, they do not give rise to the same, but to different edges with different integer-valued weights. These edges can be assigned to three different layers such that the consumer-item graph becomes a so-called *multiplex* or *multilayer graph*.

With these additional conventions (summarized by the "representation" column in the table of fields), the `graph` collection *becomes* the consumer-item graph. For now and in future posts, I am therefore identifying them with each other. Indeed, the difference between a graph and the storage structure that holds it is mostly one of semantics rather than substance.
