---
layout: post
title:  "Communities and Markets"
date:   2015-07-07 08:00:00 EDT
categories: ["big data", "graphs", "community detection", "market segmentation"]
cover: /assets/images/birdcommunities.jpg
---

I have been fairly quiet as of late. This is not because nothing has happened, but rather because I have been (and still am) busy working on a data science project in which I try something new and exciting. Recently, I was out of town for a couple of days traveling the Maritimes, and I found some time to reflect and to start writing on a series of articles about this particular project. This is now the first.

In my new project, I am studying the segmentation of large markets by identifying communities of consumers with similar shopping habits. This is an effort to improve recommendation systems and to allow for better business opportunities. <span class="more"></span>

I started this project because I wanted to apply my knowledge of the physics of complex systems to models of real-world data, for instance, data coming from politics, linguistics, humanities, biology, or economics. Previously, I have studied the localization properties of large and complex quantum networks that model ultra-cold Rydberg gases, Lévy spin glasses, and photosynthetic light-harvesting complexes. Now, in this project, I am detecting clusters and communities in large graphs with many vertices and edges. In general, these graphs can represent the connections between senators and bills in a parliament, documents and terms in a corpus, authors and papers in academia, viewers and movies on Netflix, or consumers and items in a market. At the moment, it is the latter I am most interested in. On the surface, I merely exchanged the complex networks with the synonymous complex graphs and the question of localization with the closely related issues of *graph clustering* and *community detection*. (Note that clusters and communities describe the same phenomenon. I use the word "cluster" for things and "community" for people.) Should be easy enough to make quick progress, right? Little did I know ...

When I began, I thought that I had already most of what I would be needing, in terms of both knowledge and experience. Surely, I thought, finding clusters in a graph is just the same as finding the localized eigenstates of the graph's adjacency matrix. Now, having worked with real data and having consumed large amounts of literature on graph clustering and community detection {% cite Newman2004Finding-and-eva Newman2006Modularity-and- Schaeffer2007Graph-clusterin Reichardt2008Structure-in-Co Blondel2008Fast-unfolding- Lancichinetti2009Community-detec Fortunato2010Community-detec Peixoto2013Parsimonious-Mo Jeub2015Think-locally-a De-Domenico2015Structural-redu --file 2015-07-07-communities-and-markets %} as well as general machine learning {% cite Abu-Mostafa2012Learning-from-D James2013An-Introduction --file 2015-07-07-communities-and-markets %}, I must admit that I was a little too optimistic. It is not quite the same, and the techniques out there are different from what I am used to do. Yet, I still think that what I want to do is doable, and I continue to work steadily towards it, but at a speed slower than anticipated.

The trouble is that the relevant methodology is not only state of the art, *it is an area of active research*, and I have been caught right in the middle of it.

In this article, I tell you about:

*	an interesting data source to study market segmentation,

*	the bipartite or two-mode graph representation,

*	the one-mode projection, and

*	community analysis.

My original motivation lies with clusters and communities, and so I decided to start at the very end:

# Community Analysis

Since I will be referring to communities many times throughout this article, let me tell you what a community is in the context of graphs and networks (you will find me using these terms interchangeably, same for "vertex" and "node" as well as "edge" and "link").

While there is no generally accepted formal definition of a community, an informal definition could be that of a densely connected group of network nodes: typically, a community is supposed to have a higher density of internal connections and a lower density of external connections compared to a reference. The sparser the connections between the communities, the better.

I tried to illustrate that with the [cover picture above](#). It shows a group of wild herring gulls on Ciboux Island in Cape Breton, Nova Scotia. Each bird represents a node in a network (blue circles). The links drawn between the birds are of course a product of my imagination. They do not correspond to any real data. Notwithstanding, herring gulls are highly intelligent birds, and these links may represent a possible structure of their society. In the example I produced, the network of gulls has community structure. As indicated by the dashed shapes, there are three communities where birds are more densely connected to fellow birds than to the birds in the rest of the network. The goal of community detection is to infer that community structure from the links alone. To be unbiased, the analysis needs to be done without using any prior knowledge on the social circles in the bird population, if such knowledge were to exist.

## How do we detect communities?

The problem of community detection belongs to the field of *unsupervised learning*. There are vastly different opinions about how to address it, but most approaches fall in either of two categories:

- the approach starts with a theoretical framework that defines precisely what a community is supposed to be, or

- the approach is heuristic and begins with the development of a detection algorithm.

In the first case, a measure of the quality of the community structure is devised, and the challenge is to assemble groups of nodes that maximize it. In the second case, the algorithm is deployed and the communities are defined simply as its output, whatever that may be. Surprisingly, the results of both approaches tend to be consistent with each other, in the sense that they produce communities adhering to the idea of densely connected groups as introduced above. However, there is still no "gold standard" of community detection. That means it is unclear which method is universally superior.

So, how do we choose one? Looking at the available measures and algorithms {% cite Fortunato2010Community-detec --file 2015-07-07-communities-and-markets %}, we find that all have their pros and cons. Some deliver mixed results and have proven weaknesses, but are still in use because they scale well with graph size and are easy to deploy. Others are much more accurate and rest on solid theoretical foundations, but are forbiddingly expensive to use on large graphs. It takes some time to get an overview of the large number of options. But this also has its positive side. For each use case, there is usually a good compromise between quality and deployment cost. 15+ years of intense and ongoing research from many specialists around the world has made sure of it. I discuss some aspects of community detection methods below and focus on particular algorithms (including those I use personally) in future articles.

## Why so much interest in community analysis?

Much of the interest is spurred by the empirically proven fact that the nodes in a community are similar by function or by role. Hence, finding the communities and how they are organized allows one to understand the network's large-scale functional structure. This knowledge is absolutely essential in most real-world cases. Networks representing real systems and their relationships are usually large and complex. They are not regular lattices, but combine aspects of order and disorder in a non-trivial way. Due to that complexity, exploring such networks can easily become an insurmountable task. It's easy to get lost in the details and also to mistake random structure for regular patterns. However, a graph's structure can become humanly understandable if the nodes are grouped into a set of interacting and unique communities. This gives a coarse-grained representation of the network, a bird's-eye view that focuses on functions and roles only.

## Some use cases

Let me give you a couple of examples for when community analysis is useful:

###### The clustering of the World Wide Web.

Each page in the WWW can be thought of as a vertex in a giant graph with hyper-links between pages for edges. A community of web pages corresponds to a selection of pages with similar themes, topics, or content, since pages tend to link to related pages more often than to unrelated ones. A community detection algorithm can be given the task to detect the themes and affiliated web pages using only the information about the links between them. Apart from studying the structure of the web, this kind of analysis can be used to organize the Internet to make it easier to find content, to deliver personal recommendations, and to fight informational overload.

###### The analysis of the social or friendship structure of on-line social networks like Facebook, Twitter, LinkedIn, or Google+.

On these platforms, users reveal their relationship with each other voluntarily. On Facebook, for instance, two users are connected by a mutual declaration of friendship that can be represented as an undirected edge in a graph of users. On Twitter, on the other hand, users do not befriend each other, but subscribe to each others' feeds. Users are connected by directed edges pointing from a follower to the one being followed. For these and similar platforms, community detection can quite literally solve the problem of identifying the (large-scale) communities that users belong to. These communities will tend to consist of like-minded users with common interests. Moreover, a user sitting at the center of a community shares many edges with other members and may be a so-called *influencer* who acts as a central hub for inspiration and opinion. Influencers have a function of control and stability within the community. In contrast, a well-connected user sitting at the boundary between two communities may foster the exchange between them. Undoubtedly, this kind of data is interesting for purposes of targeted advertising and marketing.

<p>
  <figure>
    <a href="https://www.facebook.com/notes/facebook-engineering/visualizing-friendships/469716398919"><img src="/assets/images/163413_479288597199_8388607_n.jpg" title="friendship visualization"></a>
    <figcaption>Visualization by <a href="https://www.facebook.com/paulgb">Paul Butler</a> showing which cities have a lot of Facebook friendships between them.</figcaption>
  </figure>
</p>


###### The study of biological networks, gene co-expression networks in particular.

In such a network, each node is a gene of an organism. The connections between the genes are undirected and indicate that two genes lead to the same properties of the organism's phenotype, i.e. its observable characteristics or traits. For this kind of data, community detection is important, because with it one can identify gene functions in an unbiased way. This is an application of the fact that communities are often similar in role or function.

These are just the first three examples I can think of. There are many more, but I'll stop here, since I am sure these examples prove my point that community analysis is important and solves real problems.

# Communities from Bipartite Graphs

The above examples have something in common. In each one of them, the link structure is either fully known or easily obtainable. In many cases, however, this is not the case. In fact, it can be very challenging or even impossible to collect information about the links between the network nodes directly. This section is about the methods that have been developed to cope with this situation.

Consider the task of collecting data about the political alliances between members of a parliament {% cite Neal2014The-backbone-of --file 2015-07-07-communities-and-markets %}. Here, asking every pair of politicians about their mutual alignment is not really an option. That would give only a very biased picture of reality, either because the politicians would decline to comment or because their answer would just reflect their respective party memberships. A solution to this problem is to get the data not from the politicians directly, but indirectly from their actions, for instance, from whether records show that they tend to agree or disagree in matters of legislation. For example, in an effort to detect political alliances, Neal {% cite Neal2014The-backbone-of --suppress_author --file 2015-07-07-communities-and-markets %} analyzed data about the sponsorship of bills by senators in the US congress.

One of the earliest attempts of inferring unobserved relationships is the work of Davis et al. {% cite Davis1969Deep-south -A --file 2015-07-07-communities-and-markets %}, who studied what is now known as the classic Southern Women network (see picture below). This ethnographic dataset is a record of the attendance of 18 women at 14 informal social events that took place in the 1930s in southern Alabama. The goal was to unravel the connection between an individual's social class and her pattern of informal interaction in 1930s America. In the absence of any modern community detection methods, Davis et al. relied fully on their ethnographic knowledge and intuition. They discovered that the women were split into two loosely overlapping groups, evidencing two latent social classes.

<p>
  <figure>
    <a href="http://networkdata.ics.uci.edu/netdata/html/davis.html"><img src="/assets/images/davis.png" title="participation of the Southern Women in informal events"></a>
    <figcaption>Participation of 18 Southern Women in 14 informal events as it appears in the original publication {% cite Davis1969Deep-south --file 2015-07-07-communities-and-markets %}.</figcaption>
  </figure>
</p>

Over time, the Southern Women dataset has become a benchmark of analytic methods in social network analysis and continues to be relevant today [see Freeman {% cite Freeman2003Finding-social- -A --file 2015-07-07-communities-and-markets %} for a lucid review of this and 20 more recent analyses of the same data]. A modern way of dealing with this data would be to represent it as a *bipartite graph*. In such a graph, the women and the events would form two disjoint classes of vertices. These classes are also called the *modes* of the graph. Every edge in the graph connects nodes of a different mode. In this way, an edge between a woman and an event marks an attendance. Similarly, in a bipartite graph representation of the senator-bill co-sponsorship data, an edge between a senator and a bill indicates a sponsorship.

Bipartite graphs are of use where relationships between different kinds of entities need to be described and where these entities do not interact with each other {% cite Fortunato2010Community-detec Latapy2008Basic-notions-f --file 2015-07-07-communities-and-markets %}. This includes, but is not restricted to:

* scientific collaboration networks, in which authors co-author papers {% cite Newman2001aScientific-col Newman2001bScientific-col --file 2015-07-07-communities-and-markets %},

* the IMDB affiliation network where actors co-star in different movies {% cite Zweig2011A-systematic-ap Horvat2013A-fixed-degree- --file 2015-07-07-communities-and-markets %},

* document-word co-occurrence relationship networks {% cite Manning2008Introduction-to Srivastava2013Text-Clustering --file 2015-07-07-communities-and-markets %},

* the Ebay "co-opetition" network, in which consumers bid against each other for items {% cite Reichardt2008Understanding-C Reichardt2008Structure-in-Co --file 2015-07-07-communities-and-markets %},

* and, again, the Twitter network -- if we ignore the information about who follows whom and focus instead on hashtags and who tweets them {% cite De-Choudhury2010How-does-the-da --file 2015-07-07-communities-and-markets %}.

## A naïve way of inferring unobserved relationships from bipartite graphs

An example of a simple bipartite graph is depicted below. To stay with the senator-bill co-sponsorship graph mentioned above, you can think of the seals as the senators and the gulls as the bills (or vice versa).

<p>
  <figure>
    <img src="/assets/images/bipartitegraph.jpg" title="bipartite example graph">
    <figcaption>Example of a bipartite graph of seals (orange nodes) and herring gulls (blue nodes).</figcaption>
  </figure>
</p>

In the above example graph, there are neither connections among any two seals nor any two gulls. So, how is it possible to learn something about their respective relationships or similarities? In a very convoluted way, this information is already present in the graph. It can be extracted by reducing the bipartite graph to its *one-mode projections*. For instance, from the bipartite graph of senators and bills, a graph of senators can be created in which edges represent co-sponsorships of bills. The orthogonal projection produces a graph of bills only. For illustration, the following picture shows two possible one-mode projections of the example graph:

<p>
  <figure>
    <img src="/assets/images/onemodeprojections.jpg" title="one-mode projections">
    <figcaption>One-mode projections of the above bipartite example graph according to the rules 1-4 introduced below.</figcaption>
  </figure>
</p>

On the left, we have a graph of seals and, on the right, one with gulls only. The creation of these graphs followed very simple rules:

1. From the original bipartite graph, I took only the vertices of the desired mode, that is, either the seals (orange) or the gulls (blue).

2. Then I considered all pairs of vertices. I would draw an edge between a pair if, in the original graph, the vertices were connected via at least one intermediary vertex of different mode. Alternatively, I could have demanded that the vertices were reachable from one another by a walk on the graph of length two.

3. Sometimes, there was more than one such walk. In these cases, I made the edge a *multi-edge* effectively, that is, I gave it an integer weight counting the number of connecting length-2 walks.

In the above picture, edges drawn as thick lines have a *multiplicity* (weight) of two. All others are simple edges (i.e. have multiplicity one). Higher multiplicities than two did not occur.

So, after this little procedure, instead of a bipartite graph, we now have to deal with two weighted unipartite graphs. Unfortunately, that is *not* easier at all {% cite Latapy2008Basic-notions-f -l 34-35 --file 2015-07-07-communities-and-markets %}, especially if the projections are large and dense graphs. In such cases, community detection is possible in principle, but may become a significant drain on the computational resources. One may face exceedingly long convergence times and unsatisfiable memory requirements. Therefore, our next goal is to convert the weighted graphs into *sparse* and *unweighted* graphs. We want to preserve only those edges whose weights are large enough to suggest that they are important. To this end, we can:

<ol start="4">
  <li>
    Define a threshold multiplicity $t$ and keep only those edges that occur at least $t$ times {% cite Watts1998Collective-dyna --file 2015-07-07-communities-and-markets %}. In particular, if I set $t = 1$, then the above projections retain all their edges. The graphs appear unchanged except that each edge has now a weight of one. For $t = 2$, only two edges per projection survive (the thick ones). For $t \ge 3$, the graphs retain no edges at all.
  </li>
</ol>

What is the correct choice for $t$? It's not clear. What can be said is that, if the graph has the *small-world property* {% cite Watts1998Collective-dyna --file 2015-07-07-communities-and-markets %}, a small $t$ may lead to near-to-fully connected projections with one giant community that doesn't tell us anything. On the other hand, if $t$ is too large, the graph may not be connected at all, and we get equally uninformative communities consisting of single nodes. Any intermediate choice seems arbitrary. If so, can we still make use of the resulting graphs? Well, in principle, standard community detection techniques can be used on them. However, given the simplistic set of rules I used and the arbitrariness of $t$, the accuracy of the communities would be poor. An arbitrary threshold gives an equally arbitrary projection with just as arbitrary communities. The conclusion must be that the above rules are terribly naïve and happen to destroy a lot of information -- not just the identities of the discarded nodes. Hence:

## You should *never* use unconditional projection rules!

Let me justify this by going back to the senator-bill co-sponsorship network. The goal of projecting is to end up with a sparse graph in which vertices are only connected if they represent truly related objects. Would applying the rules 1-4 on a co-sponsorship network yield a graph of senators with edges indicating truly similar political alignment? I'm afraid not {% cite Neal2014The-backbone-of --file 2015-07-07-communities-and-markets %}.

Why? Because the rules do not make a difference between senators who sponsor many bills and those who sponsor few. In particular, if a senator sponsors only a few bills, each one of her sponsorships is much more important than for the average senator. By contrast, if she promotes almost every single bill, each of these sponsorships becomes relatively unimportant. Ultimately, if she were to sponsor every single bill, then this would say absolutely nothing about her political alignment. The above projection rules ignore this fully. Instead, extensively sponsoring senators will always have more edges than modestly sponsoring senators. That is not how similarity should manifest itself, because the significance of co-sponsorships is different for senators with different total number of sponsorships. Indeed, it's certainly wrong that senators who sponsor few bills are never politically allied with others, whereas those who sponsor many bills are always allied.

Similarly, the rules also do not differentiate between bills with single sponsors and those with multiple sponsors. This, too, provides valuable information that is lost under rules 1-4.  For instance, if a bill is sponsored by every senator, then we cannot infer anything about its political orientation or that of the sponsoring senators. In contrast, if two (otherwise modestly sponsoring) senators co-sponsor a controversial and hence unpopular bill, then that says a lot about their political like-mindedness.

The bottom line is that, in order to retain as much information as possible in the one-mode projection, one has to take into account the connectivities (the so-called *degrees*) of both the senators and the bills. The projection rules have to be *degree-conditional*.

## Heuristic degree-conditional projections

Below I go through two degree-conditional approaches. The first one is adapted to bibliographic collaboration networks and to the question of whether or not collaborating authors tend to organize socially into communities {% cite Newman2001aScientific-col Newman2001bScientific-col --file 2015-07-07-communities-and-markets %}. The second approach is geared towards document-word networks and the task of automated document categorization {% cite Srivastava2013Text-Clustering --file 2015-07-07-communities-and-markets %}. I pay especially close attention to this second approach, because it would have been *almost* relevant for my purposes. I explain why it didn't work out.

Common to both approaches is the refined use of edge weights. Recall that rule 4 also defines edge weights. In rule 4, each weight is simply the number of nearest neighbors that the connected nodes share in the original bipartite graph -- this number is also called the *co-occurrence*. The approaches discussed below use heuristics to define better edge weights that are more suitable to their respective applications.

### Weights for collaboration networks

While working on scientific collaboration networks, Newman {% cite Newman2001aScientific-col Newman2001bScientific-col -A --file 2015-07-07-communities-and-markets %} found a heuristic degree-conditional one-mode projection method that takes into account the number of co-authors on each publication $v$ (this number is equal to the publication's degree, $\mathrm{deg}(v)$). Newman was interested in the social bonds among collaborating scientists $u$, and he wanted the projection to respect the fact that two authors tend to know each other less well if they only collaborate on articles with many authors and much better if they repeatedly write papers together as the sole authors. To this end, Newman assigned weights to the edges in the projected author graph. A weight $W\_{ij}$ of an edge $\\{u\_i, u\_j\\}$ was made inversely proportional to the degrees of the publications the authors had collaborated in,
\\[
  W\_{ij} = \sum\_{k}' \frac{1}{\mathrm{deg}(v\_k) - 1},
\\]
where the sum runs over those publications $v\_k$ in which $u\_i$ and $u\_j$ appeared as authors (indicated by the prime, ${}^{\prime}$). The thought leading to this formula was that, while working on a publication $v\_k$, an author would have to divide her time between $\mathrm{deg}(v\_k) - 1$ co-authors on average. This prescription was found to estimate the strength of the collaborative bonds adequately. From the weighted author graph, an unweighted graph can be obtained via thresholding as in rule 4 above. This threshold is arbitrary, however.

<p>
  <figure>
    <a href="http://olihb.com/2014/08/11/map-of-scientific-collaboration-redux/"><img src="/assets/images/map_clusters_hi.jpg" title="collaboration network map"></a>
    <figcaption>Map of the collaboration networks between researchers in different cities around the world made by <a href="http://olihb.com">Olivier H. Beauchesne</a> and <a href="https://scholar.google.com/citations?user=IvruGDUAAAAJ">Félix de Moya-Anegón</a> by aggregating bibliographical data from the Scopus database. The colors correspond to different collaboration patterns as discovered by a community detection algorithm.</figcaption>
  </figure>
</p>

### Weights for document-word networks

Another interesting application of weights is the work of Srivastava et al. {% cite Srivastava2013Text-Clustering -A --file 2015-07-07-communities-and-markets %}, who obtained document clusterings from bipartite graphs representing document-word relationships. They did so by first creating weighted document-document similarity graphs and then running community detection algorithms on them. This procedure was found to outperform conventional document clustering techniques by a large margin, in particular, those based on the popular k-means algorithm {% cite Sculley2010Web-scale-k-mea Abu-Mostafa2012Learning-from-D --file 2015-07-07-communities-and-markets %}. The weights were derived from a degree-conditional measure called the *term-frequency inverse-document-frequency statistic* (tf-idf) that is the de-facto standard in the field of textual data mining {% cite Manning2008Introduction-to --file 2015-07-07-communities-and-markets %}.

When I first saw their paper, I thought I had finally found the right method to study my own networks. Unfortunately, it is not, for several reasons. Let me first explain what exactly they did and then why this won't help me.

To understand what they did, consider a document-word network. Such a network is a bipartite multi-graph. The first mode of nodes is given by the text documents $d$ in a corpus $D = \\{d\_1, \ldots, d\_m\\}$, while the second mode of nodes is given by sufficiently descriptive words or terms $t$. "Descriptive" means that these words are not prepositions or other fillers and that they appear in at least one of the documents. The co-occurrence network is a multi-graph because terms can (and usually will) occur multiple times per document. Srivastava et al. went ahead and replaced the multi-edges of such graphs with weighted simple edges. The weights were derived from the tf-idf statistic. In their scheme, the weight $w\_{ik}$ of an edge $\\{d\_i, t\_k\\}$ between a document $d\_i$ and a term $t\_k$ has two components that are multiplied with each other,
\\[
  w\_{ik} = \mathrm{tf}(d\_i, t\_k) \, \mathrm{idf}(t\_k).
\\]
The first component, the *term frequency* $\mathrm{tf}$, is defined as the number of times the term $t\_k$ is occurring in the document $d\_i$. The term frequency is therefore equal to the multiplicity of the multi-edge $\\{d\_i, t\_k\\}$. Sometimes, $\mathrm{tf}(d\_i, t\_k)$ is logarithmized or divided by the document length $\left|d\_i\right|$, but Srivastava et al. left it as it is. I have not yet figured out the reason for this, but it is justified by their results.

The second component, the *inverse document frequency* $\mathrm{idf}$, is log-inversely proportional to the number of documents using the term $t\_k$ (and therefore also to $\mathrm{deg}(t\_k)$). It is usually defined as
\\[
  \mathrm{idf}(t\_k) = \log \frac{\left|D\right|}{\left|\left\\{d \in D : t\_k \in d\right\\}\right|} = \log m - \log \mathrm{deg}(t\_k)
\\]
and is thus always non-negative. With this definition, terms that are used in fewer documents acquire more weight. They acquire no weight at all if they appear in all $\left|D\right| = m$ documents of the corpus. The effect is similar to that of Newman's edge weights in the scientific collaboration networks above.

After obtaining the weighted network, a projection onto the document mode was performed. Srivastava et al. proposed a new one-mode projection method that takes the tf-idf statistic into account. In particular, they defined a document-document similarity graph with edges $\\{d\_i, d\_j\\}$ weighted as the matrix product
\\[
  W\_{ij} = \sum_{k} w\_{ik} w\_{jk},
\\]
where $k$ runs over all terms $t\_k$ occurring in the corpus $D$. The larger $W\_{ij}$, the larger the similarity between the documents. To understand this, consider that, for any $k$, the product $w\_{ik} w\_{jk}$ is large if the term $t\_k$ occurs often in the documents $d\_i$ and $d\_j$ and rarely in any other document. Then, it is intuitively clear that the documents $d\_i$ and $d\_j$ must be very similar compared to other documents if $w\_{ik} w\_{jk}$ is large for many $k$. The weight $W\_{ij}$ is related to the *cosine similarity* used for spherical k-means clustering {% cite Dhillon2001Concept-decompo --file 2015-07-07-communities-and-markets %} -- in fact, it would be equal to it if the $w\_{ik}$ were Euclidean-normalized along the $k$ direction.

Next was community detection. Srivastava et al. did this in two stages. In the first, they deployed a weight-sensitive community detection algorithm (based on modularity optimization) on a pruned document-document similarity graph in which all edges with weights lower than a global threshold had been deleted. The threshold was chosen such that the largest connected component contained roughly half of the documents. This was preferable for computational reasons. Detecting communities in the pruned graph gave a first rough estimate of the structure of the corpus. In the second and final stage, the missing edges were re-added to the graph, and the community detection was continued to refine the results. They compared them with *ground-truth data* and found the accuracy to be very high, much higher than for conventional techniques like k-means. They attributed this success to their new 2-stage procedure. Their rationale was that edges with low weights either connect very different or very insignificant documents. Those latter documents do not offer a lot of useful information that allows for them to be associated with other documents in a meaningful way. In other words, they are subject to a lot of noise. Leaving them out in the first stage makes the community detection both more efficient and reliable.

###### Let me now tell you what prevents me from using this method.

I see two major issues. First and worst, the weighting and pruning scheme is heuristic and problem-specific. It is tailored to the case of document-term co-occurrence networks, and it is unknown whether or not it can assess similarity in more general settings, for instance, consumer-item networks. Not knowing whether or not a method produces meaningful results becomes a huge problem when ground-truth data is unavailable. Again, consumer-item networks are an important example. It should be noted that Newman's weighted collaboration networks discussed before suffer from the same issue. I will continue discussing this topic in more detail below when I introduce problem-independent methods to assess statistical significance. The application of these methods to consumer-item networks is the subject of the last section of this article. This is part of my own research.

The second issue has to do with the size and the high density of the obtained document-document graphs. This is not so much an issue for Srivastava et al., since they -- I assume for good reason -- study only medium-sized corpora of around $10,000$ documents. However, there will definitely be a problem when the corpus becomes as large or larger than, say, a $100,000$ documents. To clarify, note that the document-document similarity graphs in their article ended up being highly connected and that, even after pruning, the largest fully connected subgraphs were still half as big as its parent graphs. Note further that each edge in these graphs comes with a real-valued weight that needs to be stored. For a fully connected graph with $100,000$ nodes, that would require approximately $40$ GB of main memory. Therefore, it seems a size of $100,000$ is just beyond of what a consumer class computer can handle. Even if we have access to a large shared-memory machine, we will hardly be able to go up in size by another decimal power. What can be done about this? Can we perhaps reduce the document-document graph to a sparser, more manageable graph? Maybe, but it is not obvious how this can be done while retaining all significant information. It seems clear at this point that we cannot use global thresholding like in rule 4, since this, as we have discussed, introduces uncontrollable effects. I provide a solution in the next section.

## Systematic and problem-independent projections

I now have laid out several approaches for inferring unobserved relationships and for  arriving at sparse one-mode projections encoding these relationships. These approaches included a very naïve weighting and pruning scheme with an arbitrary global threshold (rule 4 further above) and two more sophisticated, yet but imperfect, degree-conditional approaches (just above). As discussed, these methods are flawed because they are problem-specific or make use of arbitrary choices and ad-hoc methodologies. Additionally, they do not assess the statistical significance of any extracted relationship. Depending on the dataset, these flaws may or may not be severe. They are disastrous when ground-truth data is unavailable, in which case one cannot rely on a method that has been developed specifically for another purpose, problem, or dataset, since any such method would produce results with unknown quality or meaning. The results would be worthless.

Recently, there has been increased interest in solving this problem {% cite Zweig2011A-systematic-ap Horvat2013A-fixed-degree- Horvat2013Modelling-and-i Neal2014The-backbone-of --file 2015-07-07-communities-and-markets %}. In a nutshell, the new idea is to use an ensemble of certain randomly generated one-mode projections as a reference to compare with a candidate one-mode projection. Of the candidate, only those edges are kept that are sufficiently different from the random patterns of the reference. The rest is discarded. This is to ensure that all relationships extracted by the one-mode projection are statistically significant. I explain this new method below. It supersedes the problem-specific approaches.

### The setup

So let's go, shall we? To make things more precise, first some definitions: Let $G = (U, V, E)$ denote the observed bipartite graph with the edges $E$ and the non-intersecting node sets $U = \left\\{u\_{1}, \ldots u\_{m}\right\\}$ and $V = \left\\{v\_{1}, \ldots v\_{n}\right\\}$, where $m = \left|U\right|$ and $n = \left|V\right|$. Following the graph of gulls and seals pictured above, I will refer to $U$ as the *top mode* and to $V$ as the *bottom mode*. Let $A$ be the adjacency matrix of $G$. The entries $A\_{ik}$ of this $m \times n$ matrix are binary. $A\_{ik}$ is $1$ if the nodes $u\_i \in U$ and $v\_k \in V$ are connected by an edge. Otherwise, $A\_{ik} = 0$. Thus, top nodes are represented in $A$ as rows, whereas bottom nodes are represented as columns. From $A$ we can derive two matrices $T$ and $B$. They are called the top and the bottom *co-occurrence matrix* and can be defined as {% cite Breiger1974The-duality-of- --file 2015-07-07-communities-and-markets %}
\\[
  T = A A^{\mathrm{T}}
\\]
and
\\[
  B = A^{\mathrm{T}} A,
\\]
respectively. $T$ is an $m \times m$ matrix and $B$ an $n \times n$ matrix. As the name suggests, the entries $T\_{ij}$ (or $B\_{kl}$) of $T$ ($B$) are equal to the *co-occurrences* of the nodes $u\_i$, $u\_j \in U$ ($v\_k$, $v\_l \in V$). The co-occurrence is the number of neighbors $v \in V$ ($u \in U$) common to both $u\_i$ and $u\_j$ ($v\_k$ and $v\_l$). It is also equal to the number of connecting length-2 walks. Thus, calculating $T$ (or $B$) is equivalent to applying rules 1-3 from earlier above!

This is essentially all we need. Yet, since we are interested in a degree-conditional one-mode projection, we should spend one more moment to make sure that we agree on what that means. The degree $\mathrm{deg}(v)$ of a vertex $v \in V$ is the number vertices $u \in U$ that share an edge with $v$. The degree $\mathrm{deg}(u)$ of $u$ is defined analogously. Degree-conditional therefore means that the one-mode projection is sensitive to the degrees of both the top and the bottom mode vertices.

### The method

Let me now describe the actual projection procedure. For the sake of clarity, I'm focussing on the top mode projection only, since the procedure for the bottom mode projection is analogous. If you write the degrees of all top vertices down in a sorted list, 
\\[
  \mathcal{D}(U) = \left(\mathrm{deg}(u\_1), \ldots, \mathrm{deg}(u\_m)\right),
\\]
you get the so-called top *degree sequence*. For the procedure, it is important to note that the two degree sequences of $G$ -- its top and its bottom sequence, $\mathcal{D}(U)$ and $\mathcal{D}(V)$, respectively -- are insufficient to uniquely identify $G$. In other words, there are many bipartite graphs with the same top and bottom degree sequence. In the method proposed by Zweig et al. {% cite Zweig2011A-systematic-ap Horvat2013A-fixed-degree- -A --file 2015-07-07-communities-and-markets %}, the entirety $\mathcal{G}$ of all these graphs defines the reference that we need to test our observation for statistical significance. In particular, by comparison with the average top co-occurrences among all these graphs, we can decide whether or not the observed co-occurrence of a pair of top vertices in $G$ is too unlikely to have occurred by chance and thus presents a pattern. That decision is formalized by a statistical hypothesis test. If the test says that the co-occurrence of two top vertices is statistically significant, we place an edge in the top-mode projection. Otherwise, we don't.

In practical terms, the steps to get a reduced top mode graph are:

<ol start="4">
  <li>
    From the population $\mathcal{G}$ of bipartite graphs with the <em>same</em> degree sequence as that of $G$, generate a representative sample $\left\{G^{(k)}\right\}_{k=1, \ldots, N}$ of $N$ unbiased random graphs $G^{(k)} = \left(U^{(k)}, V^{(k)}, E^{(k)}\right)$. Sampling is necessary because $\mathcal{G}$ is almost always too large to be enumerated in its entirety.
  </li>
  <li>
    Project each $G^{(k)}$ onto its top mode and calculate the <em>estimate</em> of the mean co-occurrence matrix, $\overline{T}{}^{(k)} = N^{-1} \sum_{k} T^{(k)}$, of the population $\mathcal{G}$.
  </li>
  <li>
    For each pair $\left\{u_i, u_j\right\}$ of vertices in the top mode $U$, perform a statistical hypothesis test at the <em>significance level</em> $\alpha$. There is an element of choice to the value of $\alpha$, although usually $\alpha$ is not larger than $0.05$. For the test, default to the assumption that the true mean $\mu_{ij}$ of $u_i$ and $u_j$'s co-occurrence in the population $\mathcal{G}$ is not smaller than the one observed, that is, $\mu_{ij} \ge T_{ij}$. This will be referred to as the <em>null hypothesis</em> $H^{0}_{ij}$ for the edge between the nodes $u_i$ and $u_j$ in the projection. The <em>alternative hypothesis</em> $H^{1}_{ij}$ is that the observed co-occurrence $T_{ij}$ is larger than what one would expect from a random graph. Now, from Student's $t$-distribution, compute the probability $p_{ij}$ of obtaining $\overline{T}_{ij}$ given that $H^{0}_{ij}$ is true. If $p_{ij}$ is less than the significance level $\alpha$, the result is statistically significant, and the null hypothesis has to be rejected in favor of the alternative hypothesis. In this case, place an edge between $u_i$ and $u_j$ in the reduced one-mode graph. If there is not sufficient evidence to warrant rejection of $H^{0}_{ij}$ at the significance level $\alpha$, do <em>not</em> connect $u_i$ and $u_j$.
  </li>
</ol>

These rules replace the old rule 4 from before. Rules 1-3 remain untouched.

I haven't told you yet how you can sample from the population  $\mathcal{G}$ (as required by the new rule 4). Zweig and Kaufmann {% cite Zweig2011A-systematic-ap -A --file 2015-07-07-communities-and-markets %} used the *Markov Chain Monte Carlo* (MCMC) sampling algorithm introduced by Gionis et al. {% cite Gionis2007Assessing-data- -A --file 2015-07-07-communities-and-markets %}. Its pseudo-code is reproduced below:

```text
$G^{(0)}$ ← $G$
$k$ ← $1$
while $k$ ≤ $N$ do
  $G^{(k)}$ ← $G^{(k-1)}$
  $t$ ← $0$
  while $t$ < $T$ do
    draw uniformly at random \ 
      two edges $\{u, v\}$, $\{u', v'\}$ ∈ $E^{(k)}$ \
      where $u$ ≠ $u'$ ∈ $U^{(k)}$ and $v$ ≠ $v'$ ∈ $V^{(k)}$
    if $\{u, v'\}$ and $\{u', v\}$ ∉ $E^{(k)}$
      remove $\{u, v\}$ and $\{u', v'\}$ from $E^{(k)}$
      and add $\{u, v'\}$ and $\{u', v\}$ to $E^{(k)}$
    else
      do nothing
    end if
    $t$ ← $t + 1$
  end while
  $k$ ← $k + 1$
end while
```

The algorithm produces $N$ samples from the population $\mathcal{G}$, one after the other. In the beginning, it uses $G$ as a template. Later, it uses the end result $G^{(k-1)}$ of the previous generation as the starting point of the next one. Each generation $k$ is the outcome of a Markovian random walk, and each walk has $T$ (time) steps, where $T$ is called the *mixing time*. $T$ has to be chosen sufficiently large such that the random walk reaches its equilibrium. Only then the produced graph $G^{(k)}$ will be independent from its predecessor $G^{(k-1)}$. In each step $t$ of the walk, two non-adjacent edges $e = \\{u, v\\}$ and $e' = \\{u', v'\\}$ are drawn randomly from a uniform distribution. Then the algorithm tries to exchange the bottom-mode vertices between the edges. This operation is called an *edge swap*. It is designed to keep the degree sequences $\mathcal{D}\left(U^{(k)}\right)$ and $\mathcal{D}\left(V^{(k)}\right)$ the same. If the swapped edges are not already in the graph $G^{(k)}$, then they are added to it, after $e$ and $e'$ have been removed. Otherwise, the algorithm proceeds to the next step. Note that the edge swap can be implemented by performing a bitwise NOT operation on those four elements of the adjacency matrix of $G^{(k)}$ that corresponding to $e$, $\\{u, v'\\}$, $\\{u', v\\}$, and $e'$.

### The benefits

An immediate question is how large $N$ and $T$ have to be in practice. Zweig and Kaufmann {% cite Zweig2011A-systematic-ap -A --file 2015-07-07-communities-and-markets %} report that $N = 5,000$ and $T = 70,000$ were sufficient for the [Netflix price data](https://en.wikipedia.org/wiki/Netflix_Prize). Note, though, that they deployed their method on subgraphs of $20,000$ user nodes only. The complete Netflix graph has movie ratings from $480,000$ users. For each one of these subgraphs, the computation took roughly a second on a low-end PC. Rule 4 is therefore quite inexpensive computationally. However, the authors observed that processing of rule 5 is considerably slower, in their case, by a factor of five. We recall that the purpose of rule 5 was to estimate the average top and bottom co-occurrence matrices. This can become a serious bottleneck. However, in most real-world cases, the effort is worth it, since Zweig and Kaufmann's method is currently the only one that:

* **DOES THE JOB** -- i.e., allows for *high-quality* detection of communities of entities (users, consumers, items, authors, documents, terms, etc.) whose relationships are *not* directly available (due to being unobserved or unobtainable) --,

* **IS ACCURATE** -- even if accurate labels are unavailable (e.g., weak or unknown ground-truth), i.e. the method is *unsupervised* --,

* **IS SCALABLE** -- works for large, *big-data* networks (e.g., the Netflix price data) --,

* **IS EFFICIENT** -- i.e., extracts a *manageable* (sparse and unweighted) graph that encodes all entity relationships --,

* **IS RELIABLE AND STABLE** -- ensures that all extracted relationships are statistically significant, i.e. vertices are connected only if their relationship is *important* and *unexpected* --,

* **IS VERSATILE** -- i.e., is *not* problem-specific and can replace all miscellaneous, heuristic approaches --,

* **IS FLEXIBLE** -- can handle graphs with strongly skewed, *heavy-tailed* degree distributions, a very common situation in real-world data --,

Beware, there are also a few limitations. For instance, the extraction method itself can be computationally expensive. Another issue is that, so far, it works for data only that can be represented as unweighted simple bipartite graph. This is probably the biggest complaint I have, see below.

# Market Segmentation And Recommendation Systems

After talking about all that fascinating theory, it is now time to put it all together and to experiment with it. For a market with a large number of consumers and purchase items, I am addressing the following two questions:

> Do consumers organize into weakly overlapping communities with homogeneous buying interests, so-called market segments?

And:

> Do items divide into clusters of similar items that are co-purchased more often than expected from pure chance?

Market segmentation is relevant for the success of targeted advertising and marketing campaigns, for instance, in the form of special offers, coupons, vouchers, or promotions. Since the consumers of a segment tend to have very similar shopping habits, it becomes possible to predict and -- via algorithmically curated recommendations -- to influence some of their future purchases. The clustering of items assists in this task. Clustering sheds light on the similarity of items, particularly, the similarity inferred from them being purchased by the same consumers. Understanding which items are bought together and by whom is at the heart of successful recommendation.

The challenge is to answer the above questions in the absence of any direct data about consumer interests or item similarity. All that information has to be inferred from somewhere. Thanks to the extensive discussion in the previous sections, we know from where. That is what bipartite graphs are good for. Here, in particular, I deal with *consumer-item graphs* that I introduce below. First, however, a disclaimer:

*Please note that the following is work in progress. At this time, I can only discuss the problem and the basic methodology. Everything else, including the results, will be published here on this blog when they are ready.*

## The graph-based approach

Consider an Internet-based retailer like [Amazon](http://qz.com/393360/amazon-is-in-danger-of-becoming-a-lumbering-conglomerate/) or [Zalando](http://www.forbes.com/sites/ryanmac/2014/07/30/zalando-europe-zappos-fashion/). The elementary pieces of such a marketplace are usually the consumers and the items. In a consumer-item graph, these pieces become vertices, whereas the interactions between the consumers and items become edges. The following types of interactions are common:
\\[
  \text{consumer} \xrightarrow{\text{browses/investigates}} \text{item}, \\\\
  \text{consumer} \xrightarrow{\text{favors/loves/endorses}} \text{item}, \\\\
  \text{consumer} \xrightarrow{\text{recommends/shares}} \text{item}, \\\\
  \text{consumer} \xrightarrow{\text{rates}} \text{item}, \\\\
  \text{consumer} \xrightarrow{\text{purchases}} \text{item}, \\\\
  \text{consumer} \xrightarrow{\text{uploads picture of}} \text{item}, \\\\
  \text{consumer} \xrightarrow{\text{returns}} \text{item}, \\\\
  \text{consumer} \xrightarrow{\text{reviews}} \text{item}.
\\]
Since all these interactions have only one logical direction (e.g., an item cannot buy a consumer), they can be modeled as undirected edges. And, since there are neither interactions among any two consumers nor any two items, the graph is bipartite.

In the graphs we encountered in previous sections, each edge describes only one type of interaction. It is possible to extend the theory to the case of edges with multiple types. The graphs in this generalized theory are called *multiplex graphs* {% cite De-Domenico2013Mathematical-fo Horvat2013A-fixed-degree- De-Domenico2015Structural-redu --file 2015-07-07-communities-and-markets %}. Many of the ideas and methods that we discussed extend to multiplex graphs. But it's a complication that I want to leave for later. For now, I want to concentrate on monoplex graphs with one edge type only. Therefore, I have to make a decision what type of interaction I want to consider. The rest is abandoned.

For the two questions I am addressing, only the purchases (and, to an undetermined degree, the returns) are relevant. I was therefore looking for a source of real purchase transaction data.

## The data

I settled on the [Acquire Valued Shoppers Challenge](https://www.kaggle.com/c/acquire-valued-shoppers-challenge) data from Kaggle. That challenge has ended, but the data is still available. It contains $349,555,789$ transactions (i.e. atomic item purchase and return records) of $311,452$ unique consumers. The original challenge was about predicting whether or not consumers would become loyal to a product or brand if they were presented an offer.

The data is fully anonymous. It holds information solely about which items consumers have bought, when, at which price, and at what quantity, where negative prices and/or quantities more or less consistently indicate item returns. For each consumer, there is a year's worth of transaction data. The items are represented in terms of three numbers that uniquely identify the manufacturer, the brand, and the item's category. It is not disclosed, however, what these manufacturers, brands, and categories are. There is some further information about item sizes and the units they are measured in, but this serves little to understand the nature or origin of an item. Transactions of items with missing manufacturer, brand, or category are discarded from my studies. So are transactions by unidentifiable consumers.

The transaction dataset is large, it has a size of over $20 \mathrm{GB}$. I defer a discussion about the logistics and mechanics of my dealings with this dataset to [a later blog post](javaScript:void(0);). For now, I am more interested in discussing the properties of the graphs. To this end, I would like to direct your attention towards the following figure:

<p>
  <figure>
    <a href="https://plot.ly/~tscholak/100/" target="_blank" title="Probability density of the number of distinct items purchased by a consumer" style="display: block; text-align: center;"><img src="https://plot.ly/~tscholak/100.png" alt="Probability density of the number of distinct items purchased by a consumer" style="max-width: 100%;"  onerror="this.onerror=null;this.src='https://plot.ly/404.png';" /></a>
    <script data-plotly="tscholak:100" src="https://plot.ly/embed.js" async></script>
  </figure>
</p>

Shown is a histogram of the number of distinct items (the "counts" on the horizontal axis) purchased by the consumers. "Distinct" means that repeated purchases of the same item are not counted. Visually, the distribution bears some similarity to the [Weibull distribution](https://en.wikipedia.org/wiki/Weibull_distribution) that is used to describe the lifetime and failure rate of engineered systems or components. However, this seems coincidental, since there is no mechanism in the consumer's shopping behavior that would justify the resemblance.

The most obvious thing we learn from this distribution is that the typical consumer in the Kaggle dataset bought roughly $340$ different items. The spread is quite high, the standard deviation is $220$ approximately. On the left side of the histogram are the consumers who purchased only a few different items -- because they either left the market early or are fiercely determined in their choices. On the other side is the tail of consumers who explored a much larger portion of the inventory. There are transactions for $116,071$ unique items in the dataset, and some lavishly spending consumers managed to purchase a significant fraction of them. The above plot does not give this justice, however. I therefore show you another histogram with logarithmic rather than linear binning, plotted on a log-log scale:

<p>
  <figure>
    <a href="https://plot.ly/~tscholak/98/" target="_blank" title="Probability densities with logarithmic binning" style="display: block; text-align: center;"><img src="https://plot.ly/~tscholak/98.png" alt="Probability densities with logarithmic binning" style="max-width: 100%;"  onerror="this.onerror=null;this.src='https://plot.ly/404.png';" /></a>
    <script data-plotly="tscholak:98" src="https://plot.ly/embed.js" async></script>
  </figure>
  <figcaption>I am sorry that these plots don't work that great on phones.</figcaption>
</p>

The pink curve shows the same distribution as before. Clearly, the curve is increasing linearly for small counts. Since this is a log-log plot, it means that the distribution is a power-law in the count. The decay has two stages. The first one can be seen in the previous figure and is Weibull-like. The second stage begins at $1,300$ counts, extends to at least $15,000$ counts, and is very different. There is some noise, but it appears to be a linear descent, again indicating a power-law in the count. There seems to be a small number of consumers in the market with atypical, extremely lavish spending habits. I have not yet decided whether or not I will remove these consumers from the data. They could be using company spending accounts or just be artifacts produced by faulty data. I am not interested in either.

There are two other curves in the figure. The yellow curve is a histogram of the number of distinct consumers that purchased an item. Its shape is much different than that of the distinct item count histogram. The curve is continuously decreasing and has an extremely long tail. This means that niche items that are bought by only a handful of consumers are as significant as extremely popular items that are bought by a $100,000$ individual consumers.

Finally, the green curve is a histogram of the edge multiplicity. Recall that consumers and items are presented as bipartite graph, where the edges indicate purchases. Hence, the edge multiplicity counts how many times an item has been purchased by the same consumer, and the histogram states the likelihood that this count has a specific value. The curve decays as a power law and also much stronger than the yellow curve does. However, the tails of this distribution are still heavy and thus the probability of repeated purchases highly significant.

## Methodology and outlook

In previous sections, I have discussed bipartite graphs and how one can deduce unobserved relationships from them. In this project, I want to deduce both the similarity between items and the similarity in the shopping habits of consumers. What method should I use?

Since I aim for accuracy and reliability, there is really only one choice: the method of Zweig and Kaufmann {% cite Zweig2011A-systematic-ap -A --file 2015-07-07-communities-and-markets %}. Let me spell out three reasons for why I cannot use heuristic similarity metrics for this particular transaction dataset.

1. The ground-truth provided is weak. There is some information on price, shop category, item brand, and item manufacturer. The dataset also mentions the branch and store department in which the purchased items appeared. Maybe the results will correspond somehow to these miscellaneous taxonomies, maybe they won't. If I were to borrow a method originally developed for another purpose -- e.g., a method using edge weights derived from the tf-idf statistic and the cosine distance --, without ground-truth validation, I would be unable to make sense out of the results. 

2. The graph has power-law degree distributions and small-world properties. As shown above, the distributions of both the edge multiplicity and the number of distinct consumers exhibit heavy tails. Zweig and Kaufmann's method is flexible enough to handle graphs with heavy-tailed degree distributions.

3. The graphs are big. The consumer-similarity graph will have $116,071$ nodes, and the item-similarity graph will have $311,452$. I can only work with these graphs if they are sufficiently sparse. Zweig and Kaufmann's method produces sparse and unweighted single-mode graphs. It places edges between nodes only if their co-occurrence is unexpectedly large.

All this tells you that I am determined to use Zweig and Kaufmann's method. However, there is a problem. The transaction graph is a multigraph, i.e., a pair of nodes can be -- and, as evident from the multiplicity histogram, usually *is* -- connected by an edge not once, but many times. However, the method of Zweig and Kaufmann has not yet been generalized to multigraphs, and it is far from trivial to do so. It is not clear what the random null model should be. Since ignoring the multiplicity is not an option, someone will have to overcome the problem of edge multiplicity, and it seems this person will be me. I am working on it ...

That is all for now. I will write more when time permits.

* * *

# References

{% bibliography --file 2015-07-07-communities-and-markets --cited %}
