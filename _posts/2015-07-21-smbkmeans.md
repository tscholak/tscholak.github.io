---
layout: post
title:  "A $K$-Means Odyssey"
date:   2015-07-21 02:30:00 EDT
categories: ["big data", "Python", "MongoDB", "market segmentation"]
---

In this article, I tell you how I

1. implemented two versions of the tf-idf statistic,

2. applied these statistics to a [certain consumer-item transaction dataset](https://www.kaggle.com/c/acquire-valued-shoppers-challenge/data),

3. created the spherical mini-batch $k$-means implementation that you can find on [my GitHub repository](https://github.com/tscholak/smbkmeans),

4. deployed spherical $k$-means clustering on the consumer-item data, and

5. trained models with different $k$.

I call this an odyssey, because, as I was exploring, coding, and waiting for results, it occurred to me that I was lost on a journey to nowhere, and that, ultimately, all this wouldn't help me with [my project](/big%20data/graphs/community%20detection/market%20segmentation/2015/07/07/communities-and-markets.html) (for reasons explained [here](/big%20data/graphs/community%20detection/market%20segmentation/2015/07/07/communities-and-markets.html#WeightsForDocumentWordNetworks)). Yet, I was compelled to write about this futile adventure, because someone -- maybe you! -- might find it useful. <span class="more"></span>

Now, imagine the following: You are given a large pile of documents and $k$ folders labeled $1$ to $k$. You are also being told that every document belongs into one folder, but not into which one. It is your job to find that out, not for one document, but for the whole pile of them. How do you do that?

There is a solution to this problem that uses the so-called *tf-idf statistic* and an unsupervised learning algorithm called *$k$-means*. The steps are as follows:

1. Every document is scanned for its terms and keywords, and tf-idf weights are computed for every observed document-term pair. The tf-idf weight states how significant it is that a term occurred in a document.
2. Each document is represented as a vector of tf-idf weights. These vectors are called *feature vectors*. They span the *feature space*. In this space, each coordinate measures the significance of one term, and every point is one document. The points will form a pattern: there will be regions of high and low point density. The high-density regions are called clusters, and there should be $k$ of them.
3. The $k$-means algorithm is deployed on the points. The algorithm attempts to find the centers of $k$ clusters. A document is a member of a cluster if its point is closest to that cluster's center.
4. Each document is put in the folder with its cluster's label on it.

This procedure might not be the best possible, both in terms of efficiency and outcome quality, but it accomplishes the task. Afterwards, the documents are indeed sorted into $k$ folders (note that there is a flurry of real-world and synthetic examples for which $k$-means produces arbitrarily bad results, e.g., the [Mickey Mouse problem](https://en.wikipedia.org/wiki/K-means_clustering#Discussion)).

In [my current project](/big%20data/graphs/community%20detection/market%20segmentation/2015/07/07/communities-and-markets.html), I am dealing with similar classification problems, and it seemed to be a good idea to try out tf-idf and $k$-means on them before going over to any more sophisticated methods. Instead of documents and terms, I have data describing the interactions between consumers and items, i.e. data about who purchased which item and how often. Most of the methodology applies unchanged. Still, the large size of my dataset made it necessary to think about every tiny cog in the machine, and to come up with my own implementation, see below. Unfortunately, the results weren't particularly useful... -- but see for yourself.

## Implementing the tf–idf statistic

tf-idf is short for "term-frequency inverse-document-frequency" and it's a statistic {% cite Manning2008Introduction-to --file 2015-07-21-smbkmeans %}. I already wrote about tf-idf in an [earlier article](/big%20data/graphs/community%20detection/market%20segmentation/2015/07/07/communities-and-markets.html#WeightsForDocumentWordNetworks), and I won't repeat here what I said there. Instead, I am focusing on my implementation of tf-idf in Python -- actually, in [Cython](http://cython.org), which I prefer because of its higher performance. Cython code looks almost like it could be Python, but it isn't. While Python code is usually valid Cython, it doesn't work the other way around. That is because Cython allows you to exactly specify the type of each parameter and every variable, and these types can be C data types, too. This is possible, since, behind the curtain, Cython first converts the code into C and then compiles it with gcc, clang, or icc (for instance). This also explains how Cython can outperform Python: the code is not interpreted, but compiled.

###### `tfidf_module.pyx`

Let me now go through my implementation step by step. The Cython program code for the tf-idf computation (see `tfidf_module.pyx` in the [repository](https://github.com/tscholak/smbkmeans)), started with:

```cython
# -*- coding: utf-8 -*-
import cython
from cython.parallel cimport prange
import numpy as np
cimport numpy as np
from libc.math cimport log
np.import_array()
```

Nothing really interesting to see here -- just a bunch of mandatory imports. For instance, `np.import_array()` is part of Numpy's [C-API initialization](https://github.com/cython/cython/wiki/tutorials-numpy#c-api-initalization). Moving on.

Normally, the tf-idf statistic is used on corpi $D$ of documents $d$ and terms $t$. Here, however, I was applying it to my consumer-item data. The first step was to calculate the idf, the inverse document frequency, or, I should rather say, the *inverse consumer frequency*. If $t$ is an item, then $\mathrm{idf}(t)$ is defined as the logarithm of the fraction of the total number of consumers and the number of consumers $d$ who purchased $t$. In my case, `n_consumers` was the total number of consumers, and `counts` was an array with the number of purchases per consumer. Thus, $\mathrm{idf}(t)$ could be computed like this:

```cython
@cython.boundscheck(False)
@cython.wraparound(False)
@cython.cdivision(False)
cpdef np.float64_t get_idf(
        np.ndarray[np.int64_t] counts,
        np.int64_t n_consumers):
    '''Calculate idf(t, D).
    
    Uses the number of consumers d in D who purchased t.
    '''
    cdef np.float64_t idf
    try:
        idf = <np.float64_t> n_consumers
        idf /= <np.float64_t> np.sum([counts > 0])
        idf = np.log(idf)
    except ZeroDivisionError:
        idf = 0.
    return idf
```

The idf returned by this code was high for a rare item and low for a popular one. My code intercepted division-by-zero errors, in which case it assigned the value `0.` to `idf`. This would occur only if the item $t$ had not been purchased by anyone. Note that the particular choice, `0.`, made sure that the tf-idf statistic was always well defined. If the item had never been bought, then all associated tf-idf values became zero, cf. the code below.

The `@cython.x` decorators affected the behavior of Cython at compile time:

- Since both `boundscheck` and `wraparound` were set to `False`, Cython wasn't doing anything to prevent segfaults caused by bad indexing operations on array-like objects.
- The keyword `cdivision` determines whether or not Cython can raise a `ZeroDivisionError`. If it is set to `True`, divisions will be slightly faster, but no checks can be performed. Here I had to set it to `False`.

Now for the term frequency tf, or, rather, the *item frequency*. There are two popular definitions of $\mathrm{tf}(t, d)$ {% cite Manning2008Introduction-to --file 2015-07-21-smbkmeans %}, which I implemented as the functions `get_tf1` and `get_tf2`, respectively. Let us first discuss `get_tf1`:

```cython
@cython.boundscheck(False)
@cython.wraparound(False)
@cython.cdivision(True)
cpdef np.float64_t get_tf1(
        np.int64_t count) nogil:
    '''Return tf(t, d) for an item t.

    Uses standard formula.
    '''
    cdef np.float64_t tf
    tf = <np.float64_t> count
    return tf
```

This function was trivial. It simply returned its argument, `count`, where `count` was the number of times an item $t$ had been purchased by a consumer $d$. The alternative, `get_tf2`, was slightly more complicated:

```cython
@cython.boundscheck(False)
@cython.wraparound(False)
@cython.cdivision(True)
cpdef np.float64_t get_tf2(
        np.int64_t count) nogil:
    '''Return tf(t, d) for an item t.

    Uses alternative version.
    '''
    cdef np.float64_t tf
    tf = <np.float64_t> count
    if tf > 0.:
        tf = 1. + log(tf)
    else:
        tf = 0.
    return tf
```

Effectively, this function returned the natural logarithm of the product of Euler's number and `f`. This way, the return value of `get_tf2` was equal to that of `get_tf1` when `count` was zero or one. However, it was smaller when `count` was two or larger. You will see shortly why.

First, however, I show you how I plugged these functions together. This allowed me to calculate the tf-idf statistic, which is defined as the product of $\mathrm{tf}(t, d)$ and $\mathrm{idf}(t)$:

```cython
@cython.boundscheck(False)
@cython.wraparound(False)
@cython.cdivision(True)
cpdef np.ndarray[np.float64_t, ndim=2] get_tfidf(
        np.ndarray[np.int64_t] counts,
        np.int64_t n_consumers):
    '''Return both tf-idf versions for all items.'''
    cdef Py_ssize_t i, l = len(counts)
    cdef np.float64_t idf
    idf = get_idf(counts,
                  n_consumers)
    cdef np.ndarray[np.float64_t, ndim=2] res = np.empty(
            (l, 2), dtype=np.float64)
    for i in prange(l,
                    nogil=True,
                    schedule='static'):
        res[i, 0] = get_tf1(counts[i]) * idf
        res[i, 1] = get_tf2(counts[i]) * idf
    return res
```

This function returned both tf-idf versions. I did this so that I could decide later which one I preferred. In general, the tf-idf statistic's purpose was to attach importance to items that had been bought frequently by some consumers, yet also rare among all purchases. Both tf-idf versions accomplished that. They were

- highest when the item $t$ had been purchased lavishly *and* only by a few consumers,

- lower when it had been purchased less lavishly *or* by more consumers, and

- lowest when the item hadn't been purchased at all *or* when it had been a popular choice for everyone.

What was now the difference between the two tf-idf versions? The first one scaled linearly with the raw count, `count`. Thus, it operated under the assumption that `count` purchases of the same item were `count` times as significant as a single purchase. In contrast, the second version scaled sub-linearly with `count` and thus would have been better if the increase in significance due to an additional purchase decreased with the total number of purchases. Of course, since the tf-idf statistic is a heuristic, it was hard to justify either definition from first principles. Ultimately, a heuristic is justified by its results. I wasn't there yet, though.

###### `tfidf_setup.py`

Before I could use the tf-idf code, it had to be compiled. Python's `distutils` package assisted me with this task. First, I needed a file, `tfidf_setup.py`, with the following content:

```python
# -*- coding: utf-8 -*-
from distutils.core import setup, Extension
from Cython.Distutils import build_ext
import numpy

try:
    numpy_include = numpy.get_include()
except AttributeError:
    numpy_include = numpy.get_numpy_include()

tfidf_module = Extension(
        "tfidf_module",
        ["tfidf_module.pyx"],
        extra_compile_args=['-O3', '-fopenmp'],
        extra_link_args=['-fopenmp'],)

setup(cmdclass = {'build_ext': build_ext},
      ext_modules = [tfidf_module,],
      include_dirs = [numpy_include,],)
```

This Python file was similar in function to a `Makefile` from an [Autotools](https://en.wikipedia.org/wiki/GNU_build_system) project. It specified which module I was building and how this was supposed to be done. In this case, the module was called `tfidf_module`, and it was a Cython extension. I didn't do anything out of the ordinary here, this was fairly [run of the mill](http://docs.cython.org/src/userguide/source_files_and_compilation.html). On my Mac, the extension was built using

```bash
＄ CC=gcc-mp-4.9 python2.7 tfidf_setup.py build_ext --inplace
```

The compilation result, `tfidf_module.so`, was saved in the current directory, and the compiler used was `gcc-mp-4.9`.

###### A couple of words on parallelism

Using `gcc-mp-4.9` is one of the few ways to compile OpenMP code in a [MacPorts](https://www.macports.org) environment. OpenMP is a shared-memory multiprocessing language extension for C and C++. It is activated by the `-fopenmp` flag that I set via `extra_compile_args` and `extra_link_args` in `tfidf_setup.py` (if you use another compiler, note that Clang's OpenMP support hasn't matured yet, and that Intel C compiler's OpenMP flag is not `-fopenmp` but `-openmp`).

OpenMP is needed by Cython's `parallel` module. If you go back to the code for `get_tfidf`, you will notice that I used the `prange` iterator in the `for` loop over `counts`. `prange` caused this loop to be processed in parallel. To this end, the `tfidf_module.so` binary would spawn a thread pool. The value of `schedule` decided how the work was distributed among the threads in that pool. I used static scheduling: the array `counts` was divided in slices of equal length, each of which was assigned to one thread. That was the most efficient choice, since the workload for each of the slices was the same.

The `nogil` switch controlled what Cython did with its *global interpreter lock*, or GIL, during the for loop. I set it to `True`. This caused Cython to put the loop in a so-called `nogil` section, which still is an [unfortunate necessity](https://wiki.python.org/moin/GlobalInterpreterLock) for `prange` parallelization. Here's why: Cython's memory allocation is not thread-safe. If many threads were to manipulate Python objects at the same time -- which might occur in a `prange` loop -- then the code would behave unpredictably and perhaps crash. The GIL prevents that. It is a mutual exclusion mechanism, or mutex, that blocks concurrent access to Python objects. It also blocks OpenMP parallelism. Under normal circumstances, the GIL is the way to go and, hence, it is always in effect. Now, with `nogil=True`, I exempted the for loop from the GIL, allowing OpenMP concurrency and thus potentially hazardous access to Python objects. However, recall that it is only the Python objects that cause problems. If you don't have any Python objects in the parallel `for` loop, then it is safe to call it without the GIL. That was the case here. `idf` was a native C variable and `res` was a native C array. The functions `get_tf1` and `get_tf2` had C-type arguments and return values. I declared these functions exempt from the GIL as well by appending the `nogil` keyword to their definition. Had I not done this, they would have reacquired the GIL and thus prevented any parallelization. So the bottom line is: to use OpenMP parallelism, the GIL must be released throughout the affected section. To do this safely, no Python objects can be used.

## Applying the tf-idf statistic

Let me now tell you what I did with the tf-idf statistic. In [my current project](/big%20data/graphs/community%20detection/market%20segmentation/2015/07/07/communities-and-markets.html), I'm working with atomic purchase transaction data for over $300,000$ consumers and over $100,000$ items. In the beginning of that project, I wanted to see whether or not the tf-idf statistic could be used to assess the importance of an item to a consumer. So, I wrote code to investigate that. I discuss it below.

###### `transactions_to_tfidf.py`

The [code](https://github.com/tscholak/smbkmeans) began with a trick that I learned [here](http://stackoverflow.com/questions/279237/import-a-module-from-a-relative-path):

```python
# -*- coding: utf-8 -*-
import os
import sys
import inspect
cmd_folder = os.path.realpath(
        os.path.abspath(
            os.path.split(
                inspect.getfile(
                    inspect.currentframe()
                )
            )[0]
        )
    )
if cmd_folder not in sys.path:
    sys.path.insert(0, cmd_folder)
from tfidf_module import *
```

In order to use the `tfidf_module` extension, I had to add its location (and coincidentally that of `transactions_to_tfidf.py`) to `sys.path` so that it would be found by Python. The above code did exactly that, and it also imported all the functions defined in `tfidf_module.pyx`.

The rest of the file was derived from another script, `transactions_to_graph.py`, that I discussed [here](/big%20data/python/mongodb/2015/07/14/MongoDB-workflow.html#CreatingSpecializedDataCollections). In my case, all data was stored in a [MongoDB database](/update/python/mongodb/docker/2015/07/13/the-setup.html#MongoDB). The transaction was in a collection called `transactions`, and the tf-idf data was supposed to end up in a collection called `tfidf`. Accordingly, the script's purpose was to access `transactions`, calculate the tf-idf statistic for each consumer-item pair, and then store the results in `tfidf`.

First, the script had to import and configure several other modules to be able to talk to the database:

```python
import numpy as np
import pandas as pd
import json
from pymongo import MongoClient, ASCENDING

settings = {
        'mongo_host': 'server.local',
        'mongo_db_name': 'mydb',
        'mongo_port': 27017,
        'drop_collections_on_load': True,
        'transactions_collection': 'transactions',
        'tfidf_collection': 'tfidf'
    }

if __name__ == "__main__":
    # establish connection:
    mongo_client = MongoClient(settings['mongo_host'],
                               settings['mongo_port'])
    mongo_db = mongo_client[settings['mongo_db_name']]

    # get collections:
    transactions_collection = mongo_db[settings['transactions_collection']]
    tfidf_collection = mongo_db[settings['tfidf_collection']]
    if (settings['drop_collections_on_load']):
        tfidf_collection.drop()
```

Second, in order to be able to calculate the idf, the script had to query the `transaction` collection for the number of consumers:

```python
    # query number of consumers d in cohort D
    pipeline = [
            {"$group": {
                "_id": "$id"
            }},
            {"$group": {
                "_id": "null",
                "count": {"$sum": 1}
            }},
            {"$project": {
                "_id": False,
                "count": True
            }}
        ]
    cursor = transactions_collection.aggregate(pipeline,
                                               allowDiskUse=True)
    result = list(cursor)
    n_consumers = result[0]['count']
```

Third, the script had to query and index all individual items that occurred in the `transaction` collection:

```python
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
```

And fourth, the script had to perform a complex aggregate job:

```python
    # get items t
    # (group by brand, company, category)
    pipeline = [
            {"$group": {
                "_id": {
                    "consumer": "$id",
                    "brand": "$brand",
                    "company": "$company",
                    "category": "$category"
                },
                "purchasecount": {
                    "$sum": {
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
                    }
                }
            }},
            {"$group": {
                "_id": {
                    "brand": "$_id.brand",
                    "company": "$_id.company",
                    "category": "$_id.category"
                },
                "consumers": {"$push": "$_id.consumer"},
                "purchasecounts": {"$push": "$purchasecount"}
            }},
            {"$project": {
                "_id": False,
                "brand": "$_id.brand",
                "company": "$_id.company",
                "category": "$_id.category",
                "consumers": True,
                "purchasecounts": True
            }}
        ]
    cursor = transactions_collection.aggregate(pipeline,
                                               allowDiskUse=True)
```

Specifically, MongoDB was asked

* to group all documents in the collection by item (i.e. combinations of the fields `brand`, `company`, and `category`), 

* to retrieve all consumers who had bought an item, and

* to retrieve the number of times an item had been bought by a consumer.

`aggregate` returned a database cursor that iterated over the query's results. Each result contained the data of one particular item. This data was used to calculate the tf-idf statistics:

```python
    # process records:
    for record in cursor:
        df = pd.DataFrame(record['consumers'],
                          columns=['consumer'])
        df.loc[:, 'item'] = items.loc[(record['brand'],
                                       record['company'],
                                       record['category']),
                                      'item']
        df.loc[:, 'brand'] = record['brand']
        df.loc[:, 'company'] = record['company']
        df.loc[:, 'category'] = record['category']
        df.loc[:, 'purchasecount'] = record['purchasecounts']
        df = df.join(
                pd.DataFrame(
                    get_tfidf(
                        np.array(
                            df['purchasecount'].values,
                            dtype=np.int64),
                        n_consumers
                    ),
                    columns=['purchasetfidf1',
                             'purchasetfidf2']
                )
            )
        # insert data:
        _ = tfidf_collection.insert(
                json.loads(
                    df.to_json(orient='records')
                )
            )
```

The last command stored the results in the `tfidf` collection.

There was just one caveat: The above code was slow to iterate the aggregate cursor. It was slow enough for the cursor to run into a timeout, which caused the script to exit with an error. Since [SERVER-6036](https://jira.mongodb.org/browse/SERVER-6036) wasn't resolved (it still isn't), there were three ways to mitigate this issue:

1. Pass a value for `batchSize` to limit the number of results returned from the server in each batch. This, however, would have had unforeseeable effects because the size of the returned records varied considerably.

2. Change the server's default cursor timeout, `cursorTimeoutMillis`, see [SERVER-8188](https://jira.mongodb.org/browse/SERVER-8188). This was possible, but hackish.

3. Process the cursor as a whole and convert the result into a list, e.g. via `result = list(cursor)`. This would have cost a lot of RAM, though, too much for my machine.

I went with the second option. I used the MongoDB console to set a new timeout:

```
[tscholak@client ~]＄ mongo server.local:27017
MongoDB shell version: 3.0.4
connecting to: server.local:27017/mydb
> use admin
switched to db admin
> db.runCommand( { setParameter: 1, cursorTimeoutMillis: 2147483647 } )
{ "was" : 600000, "ok" : 1 }
> quit()
```

I set it to the largest possible value, `2147483647`, which amounts to a little less than twenty five days. Fortunately, the script finished in much less time than that.

At the end, I ordered MongoDB to create a couple of indexes:

```python
    # create indexes:
    tfidf_collection.create_index(
        [('consumer', ASCENDING)],
        background=True)
    tfidf_collection.create_index(
        [('item', ASCENDING)],
        background=True)
    tfidf_collection.create_index(
        [('brand', ASCENDING),
         ('company', ASCENDING),
         ('category', ASCENDING)],
        background=True)
```

The scripted finished by closing the connection to the database:

```python
    # close connection to MongoDB
    mongo_client.close()
```

## Clustering with spherical mini-batch $k$-means

In the introduction of this article, I already mentioned $k$-means. $k$-means is the [Helvetica](https://youtu.be/McZSUjP1AcE?t=2m15s) of clustering algorithms: it solves an old and important question, and, while many better alternatives exist nowadays, it remains ubiquitous due to its simplicity and effectiveness.

$k$-means provides a local solution for the following NP complete problem: Given an integer $k$ and a set of $n$ points in $\mathbb{R}\^{f}$, place $k$ centers -- the titular $k$ means -- so as to minimize the total squared distance between each point and its closest center. In my case, the $n$ points were the feature vectors of the consumers, and $\mathbb{R}\^f$, their feature space. I had hoped that the centers would mark market segments, with each segment representing homogeneous, but different consumption behavior. I decided to have a closer look at the $k$-means algorithm and its relatives.

### Vanilla $k$-means

A very simple implementation of $k$-means could be based on this pseudo-code:

```
$j$ ← $1$
while $j$ ≤ $k$ do
	$\pi_j^{(0)}$ ← $\{\,\}$
	$\boldsymbol{c}_j^{(0)}$ ← some (e.g. random) $\boldsymbol{x} \in X$
	$j$ ← $j$ + $1$
end while
$t$ ← $0$
while $t$ < $T$ do
	$j$ ← $1$
	while $j$ ≤ $k$ do
		$\pi_j^{(t+1)}$ ← $\left\{\boldsymbol{x} \in X: \left|\boldsymbol{x} - \boldsymbol{c}_j^{(t)}\right| < \left|\boldsymbol{x} - \boldsymbol{c}_l^{(t)}\right|, 1 \le l \le k, l \neq j\right\}$
		$j$ ← $j$ + $1$
	end while
	$j$ ← $1$
	while $j$ ≤ $k$ do
		$\boldsymbol{c}_j^{(t+1)}$ ← $\left|\pi_j^{(t+1)}\right|^{-1} \sum_{\boldsymbol{x} \in \pi_j^{(t+1)}} \boldsymbol{x}$
		$j$ ← $j$ + $1$
	end while
	if $\left|Q\left(\left\{\boldsymbol{c}_j^{(t)}\right\}, \left\{\pi_j^{(t)}\right\}\right) - Q\left(\left\{\boldsymbol{c}_j^{(t + 1)}\right\}, \left\{\pi_j^{(t + 1)}\right\}\right)\right|$ ≤ $\varepsilon$
		$t$ ← $T$
	else
		$t$ ← $t$ + $1$
	end if
end while
```

What does this code do? Initially, the algorithm guesses the positions of the centers $\boldsymbol{c}\_j$. There's a whole story about making this guess smart, a story I will not tell here. The simplest initial guess is a random one, so feel free to imagine just that. In the main loop, each point $\boldsymbol{x}$ in the set $X = \\{\boldsymbol{x}\_1, \ldots, \boldsymbol{x}\_n\\}$ is assigned to its nearest center. Then, the centers are recomputed as the centroid over all the points that have just been assigned to them. These two steps are repeated until either the changes in quality between successive iterations are small (smaller than some $\varepsilon$) or the maximal number $T$ of steps has been reached. The quality function $Q$ is equal to the total squared distance between each point and its closest center,
\\[
	Q\left(\left\\{\boldsymbol{c}\_j\right\\}, \left\\{\pi\_j\right\\}\right) = \sum\_{j=1}\^k \sum\_{\boldsymbol{x} \in \pi\_j} \left|\boldsymbol{x} - \boldsymbol{c}\_j\right|\^2.
\\]
One can prove that $q\_t = Q\left(\left\\{\boldsymbol{c}\_j\^{(t)}\right\\}, \left\\{\pi\_j\^{(t)}\right\\}\right)$ is monotonically decreasing in $t$. In other words, the partition is improving in every iteration, until it is either good enough or the algorithm runs out of patience.

I quickly found that I could not make use of the original $k$-means algorithm. $k$-means is slow, very slow, especially for large datasets. The algorithm's run-time scales at least linearly in the number of points $n$, the number of clusters $k$, and the dimension of the feature space $f$. In light of these problems, I turned to another, related algorithm: *mini-batch $k$-means*.

### Mini-batch $k$-means

Mini-batch $k$-means is a faster, better scalable algorithm than plain $k$-means {% cite Sculley2010Web-scale-k-mea --file 2015-07-21-smbkmeans %}. Both algorithms are very similar, with the exception that mini-batch $k$-means uses only small subsets of $X$, the so-called mini-batches, to compute the centroids. This reduces the computation time tremendously, but also the quality of the results. However, the difference in quality is usually insignificant. The mini-batch $k$-means pseudo-code reads:

```
$j$ ← $1$
while $j$ ≤ $k$ do
    $\pi_j^{(0)}$ ← $\{\,\}$
    $v_j^{(0)}$ ← $0$
    $\boldsymbol{c}_j^{(0)}$ ← some (e.g. random) $\boldsymbol{x} \in X$
    $j$ ← $j$ + $1$
end while
$t$ ← $0$
while $t$ < $T$ do
    $M^{(t+1)}$ ← $b$ randomly picked samples from $X$
    $j$ ← $1$
    while $j$ ≤ $k$ do
        $\pi_j^{(t+1)}$ ← $\left\{\boldsymbol{x} \in M^{(t+1)}: \left|\boldsymbol{x} - \boldsymbol{c}_j^{(t)}\right| < \left|\boldsymbol{x} - \boldsymbol{c}_l^{(t)}\right|, 1 \le l \le k, l \neq j\right\}$
        $j$ ← $j$ + $1$
    end while
    $j$ ← $1$
    while $j$ ≤ $k$ do
        $v_j^{(t+1)}$ ← $v_j^{(t)}$ + $\left|\pi_j^{(t+1)}\right|$
        $\boldsymbol{c}_j^{(t+1)}$ ← $\frac{v_j^{(t)}}{v_j^{(t+1)}} \, \boldsymbol{c}_j^{(t)} + \left(1 - \frac{v_j^{(t)}}{v_j^{(t+1)}}\right) \left|\pi_j^{(t+1)}\right|^{-1} \sum_{\boldsymbol{x} \in \pi_j^{(t+1)}} \boldsymbol{x}$
        $j$ ← $j$ + $1$
    end while
    if $\left|Q\left(\left\{\boldsymbol{c}_j^{(t)}\right\}, \left\{\pi_j^{(t)}\right\}\right) - Q\left(\left\{\boldsymbol{c}_j^{(t + 1)}\right\}, \left\{\pi_j^{(t + 1)}\right\}\right)\right|$ ≤ $\varepsilon$
        $t$ ← $T$
    else
        $t$ ← $t$ + $1$
    end if
end while
```

Compared to the above algorithm, there are only a couple of changes:

* Instead of assigning points $\boldsymbol{x}$ in $X$ to the clusters $\pi\_j$, the algorithm considers only the $b$ points from the random mini-batches $M$. These batches are different from iteration to iteration.
* There are additional variables, namely, the counts $v\_j$. Every iteration, each count $v\_j$ is increased by the number $\left|\pi\_j\right|$ of points that are closest to the $j$-th center $\boldsymbol{c}\_j$.
* The centers $\boldsymbol{c}\_j$ have a different update rule. Only in the first iteration, they are set equal to the centroid of the $j$-th cluster. In successive iterations, they remain more and more the same: the larger the fraction of old and new counts, $v\_j\^{(t)} / v\_j\^{(t+1)}$, the smaller the change. This is called a *streaming average*.
* Convergence is only checked against the points in the mini-batch $M$.

With mini-batch $k$-means, I had found an algorithm that could work with data as *large* as mine. Yet, could it also work with data with as *many dimensions* as mine? In my case, the number of dimensions $f$ was equal to the total number of items: $120,149$. The problem with so many dimensions is that every point in feature space $\mathbb{R}\^{f}$ becomes close to every other point in it. Since mini-batch $k$-means uses the distances between the points to cluster the data, the method would have performed very poorly. It would have fallen victim to what is known as the *curse of dimensionality*. I needed another distance measure.

### Spherical mini-batch $k$-means

I settled on the *cosine distance*, which estimates the similarity between two feature vectors by measuring the agreement between their directions. There is a lot of evidence to support that this measure can cope with high-dimensional data {% cite Manning1999Foundations-of- --file 2015-07-21-smbkmeans %}. The version of $k$-means that uses the cosine instead of the Euclidean distance is called the *spherical $k$-means algorithm* {% cite Hornik2012Spherical-k-mea --file 2015-07-21-smbkmeans %}. Like the tf-idf statistic, it was originally intended for use on large amounts of sparse document-term data. 

Spherical $k$-means has an advantage over plain $k$-means, because it projects the feature space onto the unit $f$-sphere, the surface of the unit hyper-ball in $f$ dimensions. This has the effect of eliminating the length of the feature vector from the considerations. In document clustering problems, the length of a document's feature vector corresponds to the document's length. In my case, it corresponded to the consumer's purchase volume, i.e. how much the consumer had bought in total. Normalizing the feature vectors resolved two problems:

1. The purchase of a particular item was always more significant for consumers who had purchased more overall than for those who had purchased little.

2. Consumers that had spent more overall had a higher chance of buying rare items -- without any evidence suggesting that these consumers had a higher preference for them than lower-spending consumers.

Indeed, after the normalization, I found that consumers with similar purchase patterns (that is, buying similar items) but differing total purchase numbers had nonetheless similar feature vectors.

I was pleased. Now I needed a mini-batch version of spherical $k$-means. I couldn't find any, so I built my own. I didn't start from scratch, though. I found that [scikit-learn](http://scikit-learn.org/stable/) has an [implementation of mini-batch $k$-means](http://scikit-learn.org/stable/modules/clustering.html#mini-batch-k-means). I studied that code, took fragments from it, and integrated these into a new algorithm that suited my goal. It can be simplified into the following pseudo-code:

```
$j$ ← $1$
while $j$ ≤ $k$ do
    $\pi_j^{(0)}$ ← $\{\,\}$
    $v_j^{(0)}$ ← $0$
    $\boldsymbol{c}_j^{(0)}$ ← some (e.g. random) $\hat{\boldsymbol{x}} \in \hat{X}$
    $j$ ← $j$ + $1$
end while
$t$ ← $0$
while $t$ < $T$ do
    $\hat{M}^{(t+1)}$ ← $b$ randomly picked samples from $\hat{X}$
    $j$ ← $1$
    while $j$ ≤ $k$ do
        $\pi_j^{(t+1)}$ ← $\left\{\hat{\boldsymbol{x}} \in \hat{M}^{(t+1)}: \hat{\boldsymbol{x}}^{\mathrm{T}} \boldsymbol{c}_j^{(t)} > \hat{\boldsymbol{x}}^{\mathrm{T}} \boldsymbol{c}_l^{(t)}, 1 \le l \le k, l \neq j\right\}$
        $j$ ← $j$ + $1$
    end while
    $j$ ← $1$
    while $j$ ≤ $k$ do
        $v_j^{(t+1)}$ ← $v_j^{(t)}$ + $\left|\pi_j^{(t+1)}\right|$
        $\boldsymbol{c}_j^{(t+1)}$ ← $\frac{v_j^{(t)}}{v_j^{(t+1)}} \, \boldsymbol{c}_j^{(t)} + \left(1 - \frac{v_j^{(t)}}{v_j^{(t+1)}}\right) \left|\pi_j^{(t+1)}\right|^{-1} \sum_{\hat{\boldsymbol{x}} \in \pi_j^{(t+1)}} \hat{\boldsymbol{x}}$
        $\boldsymbol{c}_j^{(t+1)}$ ← sparsified and normalized $\boldsymbol{c}_j^{(t+1)}$
        $j$ ← $j$ + $1$
    end while
    if $\left|Q\left(\left\{\boldsymbol{c}_j^{(t)}\right\}, \left\{\pi_j^{(t)}\right\}\right) - Q\left(\left\{\boldsymbol{c}_j^{(t + 1)}\right\}, \left\{\pi_j^{(t + 1)}\right\}\right)\right|$ ≤ $\varepsilon$
        $t$ ← $T$
    else
        $t$ ← $t$ + $1$
    end if
end while
```

Note that I placed hats on vectors that always have unit length. Sets of unit vectors got hats, too.

You can find the source code of the actual implementation on [GitHub](https://github.com/tscholak/smbkmeans). I commented it well. Due to its length, I will not discuss all aspects of the code in this article. However, I want to mention a few things that are of particular interest:

###### Initialization

Instead of randomly selecting the initial partitioning and the direction vectors, I opted to do so in a smart way in order to speed up convergence {% cite Arthur2007K-means-The-Ad --file 2015-07-21-smbkmeans %}. I followed the original scikit-learn implementation closely.

###### Mini-batches sampling and length normalization

In scikit-learn's mini-batch $k$-means implementation, the [algorithm's input](http://scikit-learn.org/stable/modules/generated/sklearn.cluster.MiniBatchKMeans.html#sklearn.cluster.MiniBatchKMeans.fit) is an array-like object, `X`, that is chunked into mini-batches transparently to the user. Although elegant, that method would not have worked for me. Since my data resided on a MongoDB instance, it was never fully accessible as an array-like object. There was simply no way to pass it to the algorithm as a whole. Nevertheless, I had to somehow enable my algorithm to sample mini-batches from the database. At the same time, I needed the algorithm to be multi-purpose. It could not be tied to any specific data storage model. The solution was to pass neither the data itself nor a database handle to the algorithm, but a custom sampling function. This function contained all the logic needed to sample the data. Here is an abridged snipped from one of my scripts that illustrates the solution:

```python
def get_batch(batch_size=100):
    # pick batch_size consumers randomly
    consumer_batch = random.sample(
            consumers, batch_size)
    # obtain sparse matrix filled with feature vectors from database
    mtx = get_consumer_mtx(consumer_batch)
    return mtx

model = SphericalMiniBatchKMeans(
        n_clusters=n_clusters)
_ = model.fit(
        n_samples=n_consumers,
        get_batch=get_batch)
```

The sampling function was called `get_batch`. It picked random samples from `consumers`, an array-like object with the IDs of every consumer in the database collection. The ID samples were then passed to `get_consumer_mtx`, which returned the associated length-normalized feature vectors, $\hat{M} = \left\\{\hat{\boldsymbol{x}}\_i\right\\}$, to the algorithm (an instance of the class `SphericalMiniBatchKMeans`). The algorithm did not verify that the vectors were indeed normalized.

###### Cluster assignment

The computation of the partitions proceeded in two steps:

1. For each input vector $\hat{\boldsymbol{x}}$, the algorithm would find the nearest mean direction vector $\boldsymbol{c}\_j$ (nearest in terms of the cosine distance).

2. The algorithm would assign the vector to the partition $\pi\_j$.

If you look up the source code, you will find these steps implemented in the functions `_labels_inertia` and `cosine_distances`. The latter function computes the cosine distance $c(\boldsymbol{x}, \boldsymbol{y})$ between two vectors $\boldsymbol{x}$ and $\boldsymbol{y}$ according to the formula 
\\[
    c(\boldsymbol{x}, \boldsymbol{y}) = 1 - \hat{\boldsymbol{x}}\^{\mathrm{T}} \hat{\boldsymbol{y}} = \frac{1}{2} \left|\frac{\boldsymbol{x}}{\left|\boldsymbol{x}\right|} - \frac{\boldsymbol{y}}{\left|\boldsymbol{y}\right|}\right|\^2.
\\]
Evidently, if $\boldsymbol{x}$ and $\boldsymbol{y}$ both have unit length, then the cosine distance is simply half the square of the Euclidean distance between the vectors.

###### Centroid update

Like the scikit-learn algorithm, my algorithm used a streaming average to come up with new direction vectors $\boldsymbol{c}\_j$ for the clusters. That was implemented in a function called `_update`.

###### Centroid sparsification

In order to make the computation more efficient, every iteration closed with a call to the function `to_sparse`, with the direction vectors $\boldsymbol{c}\_j$ as its arguments. As the name suggests, `to_sparse` attempted to make the vectors more sparse. To this end, it performed an $\varepsilon$-accurate projection of the direction vectors $\boldsymbol{c}\_j$ onto the unit ball of $L\^1$ around the origin. I got this idea from a paper by Sculley {% cite Sculley2010Web-scale-k-mea -A --file 2015-07-21-smbkmeans %}. Coordinates with very small values were set to zero and eliminated from the sparse representation. This way, the memory footprint was reduced. The actual mechanism was implemented in the function `project_L1`.

###### Convergence testing

Instead of the Euclidean distance, the convergence criterion was based on the cosine distance. Accordingly, the quality function was
\\[
    Q\left(\left\\{\boldsymbol{c}\_j\right\\}, \left\\{\pi\_j\right\\}\right) = \sum\_{j=1}\^k \sum\_{\hat{\boldsymbol{x}} \in \pi\_j} \left(1 - \hat{\boldsymbol{x}}\^{\mathrm{T}} \boldsymbol{c}\_j\right).
\\]
This function is decreasing and bounded during iterations. As in scikit-learn, the value of $Q$ is assigned to the variable `inertia`.

The stopping logic was implemented in the function `_convergence`. It was not based on the simple $\varepsilon$-criterion of the pseudo-code. Instead, it made use of an exponentially weighted average to smooth out some of the noise that was introduced by the variations between the mini-batches. Nevertheless, this improved stopping logic cannot change the fact that the algorithm converges to a local solution of the partition problem.

## Deploying spherical mini-batch $k$-means on consumer-item data

At this point, I had tf-idf-weighted consumer-item data and an implementation of spherical mini-batch $k$-means that was capable of handling the data. It was time to bring the two together and to crunch some numbers. Below I have reproduced the finished number crunching code. Check it out:

```python
# -*- coding: utf-8 -*-
import os
import sys
import inspect
cmd_folder = os.path.realpath(
        os.path.abspath(
            os.path.split(
                inspect.getfile(
                    inspect.currentframe()
                )
            )[0]
        )
    )
if cmd_folder not in sys.path:
    sys.path.insert(0, cmd_folder)
from smbkmeans import *

import pandas as pd
import numpy as np
import scipy.sparse as sp
import random

from bson.son import SON
from pymongo import MongoClient
from monary import Monary

import bz2
try:
    import cPickle as pickle
except:
    import pickle

settings = {
        'mongo_host': 'server.local',
        'mongo_db_name': 'mydb',
        'mongo_port': 27017,
        'tfidf_collection': 'tfidf',
        'models_per_k': 25,
        'ld_k_min': 0.5,
        'ld_k_max': 2.5,
        'k_steps': 50,
        'batch_size': 1024
    }

blacklist = {
        'consumers': [],
        'brands': [0],
        'companies': [10000],
        'categories': [0]
    }

if __name__ == "__main__":
    # establish PyMongo connection:
    mongo_client = MongoClient(settings['mongo_host'],
                               settings['mongo_port'])
    mongo_db = mongo_client[settings['mongo_db_name']]

    # get collection:
    tfidf_collection = mongo_db[settings['tfidf_collection']]

    # find out who the consumers are
    cursor = tfidf_collection.find(
            {"consumer": {
                "$nin": blacklist['consumers']
            }}
        ).distinct('consumer')
    consumers = np.array(cursor, dtype=np.int64)
    n_consumers = len(consumers)

    # find out how many items there are
    cursor = tfidf_collection.find().distinct('item')
    items = np.array(cursor, dtype=np.int64)
    n_items = len(items)

    # close PyMongo connection
    mongo_client.close()
```

The purpose of these lines is quite clear: import the necessary libraries, define the global settings, and query the consumers and items in the dataset. Indeed, these were not the most noticeable features of this script.

The most noticeable feature was the mini-batch sampling. I wanted to make the sampling as fast as possible. I looked up whether or not MongoDB could sample random documents natively from a collection. It couldn't -- and [still can't](https://jira.mongodb.org/browse/SERVER-533) (random sampling is a planned feature and will presumably be released with version 3.1 or so). There were a [couple of workarounds](http://stackoverflow.com/questions/2824157/random-record-from-mongodb), but I found them mostly impractical. Either they [were](http://stackoverflow.com/a/2824166/700435) [inefficient](http://stackoverflow.com/a/9499484/700435) or they used a [static entropy source](http://stackoverflow.com/a/5517206/700435) to complement the database collection permanently. Thus, I was forced to come up with a solution of my own:

```python
    # set up Monary
    monary_client = Monary(settings['mongo_host'],
                           settings['mongo_port'])

    def get_consumer_mtx(consumer_batch):
        '''Returns a sparse matrix with feature vectors for a consumer batch.'''
        pipeline = [
                {"$match": {
                    "consumer": {"$in": consumer_batch},
                    "brand": {"$nin": blacklist['brands']},
                    "company": {"$nin": blacklist['companies']},
                    "category": {"$nin": blacklist['categories']}
                }},
                {"$project": {
                    "_id": False,
                    "consumer": True,
                    "item": True,
                    "tfidf": "$purchasetfidf2"
                }},
                {"$sort": SON([("consumer", 1)])}
            ]
        try:
            # careful! Monary returns masked numpy arrays!
            result = monary_client.aggregate(
                    settings['mongo_db_name'],
                    settings['tfidf_collection'],
                    pipeline,
                    ["consumer", "item", "tfidf"],
                    ["int64", "int64", "float64"])
        except:
            return sp.csr_matrix(shape=(len(consumer_batch), n_items),
                                 dtype=np.float64)

        # convert into CSR matrix
        _, consumer_idcs = np.unique(result[0].data,
                                     return_inverse=True)
        mtx = sp.csr_matrix(
                (result[2].data, (consumer_idcs,
                                  result[1].data)),
                shape=(len(consumer_batch), n_items),
                dtype=np.float64)

        # normalize each row (this step can't be moved into the database
        # because of the item blacklist)
        for row_idx in xrange(len(consumer_batch)):
            row = mtx.data[mtx.indptr[row_idx]:mtx.indptr[row_idx + 1]]
            row /= np.linalg.norm(row)

        return mtx

    def get_batch(batch_size=100, offset=0, random_pick=True):
        if random_pick:
            # pick batch_size examples randomly from the consumers in the
            # collection
            consumer_batch = random.sample(consumers, batch_size)
        else:
            # advance index by offset
            consumer_batch = list(consumers)[offset:]
            # get the next batch_size consumers from the collection
            consumer_batch = consumer_batch[:batch_size]

        # obtain sparse matrix filled with feature vectors from database
        mtx = get_consumer_mtx(consumer_batch)

        return mtx
```

My solution sampled randomly from the array-like object `consumers` that was populated with every consumer ID. I used [Monary](/update/python/mongodb/docker/2015/07/13/the-setup.html#Monary) to retrieve the tf-idf feature vectors for every ID sample. I preferred Monary over PyMongo, Python's standard MongoDB driver, because of its speed. I only included tf-idf weights that were associated with items that belonged to a known company, brand, and category (earlier, I had found that the company ID $10,000$, the brand ID $0$, and the category ID $0$ are wild-cards). The set of feature vectors was returned as a sparse matrix.

The remainder of the code trained various models that were instances of the `SphericalMiniBatchKMeans` class:

```python
    # train the models
    ns_clusters = np.unique(np.int64(np.floor(
            10. ** np.linspace(settings['ld_k_min'],
                               settings['ld_k_max'],
                               settings['k_steps'],
                               endpoint=True))))
    np.random.shuffle(ns_clusters)
    ns_clusters = ns_clusters.tolist()
    models = [SphericalMiniBatchKMeans(n_clusters=n_clusters,
                                       n_init=10,
                                       max_iter=1000,
                                       batch_size=settings['batch_size'],
                                       reassignment_ratio=.01,
                                       max_no_improvement=10,
                                       project_l=5.) for _ in xrange(settings['models_per_k']) for n_clusters in ns_clusters]
    filename = cmd_folder + '/tfidf_smbkmeans__tfidf2.pkl.bz2'
    for model in models:
        _ = model.fit(n_samples=n_consumers,
                      get_batch=get_batch)
        fp = bz2.BZ2File(filename, 'w')
        pickle.dump(models, fp, pickle.HIGHEST_PROTOCOL)
        fp.close()
```

For the (spherical mini-batch) $k$-means, the number of partitions $k$ must be known *a priori* -- $k$ is a so-called hyper-parameter. In my case, however, $k$ was unknown. Although I was aware of extensions of $k$-means that could select the number of clusters automatically (*split-and-merge $k$-means*, for instance), I decided in favor of a more traditional approach: I performed a brute-force search on $k$. In particular, I trained not a single model, but many, for different $k$ and for different initial seeds. The trained models were dumped into a bzipped pickle file, safely preserved for later analysis.

But that's a story for another time...

## Up next

It certainly makes sense to start with $k$-means to quickly establish a baseline in preparation for a larger study. Indeed, there exist very precise approaches to the automatic clustering problem, e.g., graph-based approaches that rest on solid,  statistically motivated foundations. There are also much better methods for inferring unobserved relationships and similarities between documents in a corpus or consumers in a market. I discussed such methods in detail in an [earlier article](/big%20data/graphs/community%20detection/market%20segmentation/2015/07/07/communities-and-markets.html). In general, these methods are expensive, some even prohibitively so. I will publish incremental reports that document my efforts to deploy some of these techniques.

I also want to tell you about the results I got with tf-idf weighting and spherical mini-batch $k$-means, but these are not in a presentable state yet.

* * *

## References

{% bibliography --file 2015-07-21-smbkmeans --cited %}
