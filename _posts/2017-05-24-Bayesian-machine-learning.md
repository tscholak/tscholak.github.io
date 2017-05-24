---
layout: post
title:  "Bayesian Machine Learning -- Reasoning under Uncertainty with Edward"
date:   2017-05-24 00:00:00 EDT
categories: [Bayesianism, Talk, Edward]
---

People are faced daily with situations involving uncertain outcomes. 
However, in these situations, we often make impulsive decisions, or risky decisions that are based solely on our past experience.
These situations show what truly terrible decision makers we can be.
What is true for us in daily life is also true for executives that have to make decisions that are critical to their business.
Businesses have a lot of data, but what they typically lack are tools to utilize the data for rational decision making.

<span class="more"></span>

Probabilistic programming systems are software tools that can be used to make more rational decisions under uncertainty.
These tools yield insight by solving the so-called inference problem -- 
that is, updating a stated belief after considering new evidence.

Last week I gave a [tutorial on Bayesian machine learning at PyCon](https://us.pycon.org/2017/schedule/presentation/232/).
The software that I discussed in the tutorial is [Edward](http://edwardlib.org),
a probabilistic programming framework developed by a team of researchers at Columbia University.
It uses state-of-the-art techniques in computing that are coming from the deep learning community.

In Edward, you declare your initial belief about how a particular set of data could have been generated.
You define a simplified model of the universe, a story if you will, that simulates the creation of the observed data, or data like it,
and you include randomness in this definition, because you have to allow for the possibility that things could have turned out differently than they have in reality.

The model will have unknown parameters that, once better known, will explain the story that is captured in the model.
This is where inference comes in.
The goal of inference is to figure out which parameters yield simulated data that is consistent with the observed data,
and further, to determine how likely each possible parameter value is given the initial beliefs and the available evidence.
Note that the answer that is given by inference is not a single value like an average,
but rather, a distribution of values stating individual likelihoods.
This answer has the advantage that it is explicit and honest about the remaining uncertainty after inference,
and this is exactly what is needed when you have to make rational decisions.

Usually, inference is a complicated and tedious process, but Edward automates it.
You choose from a set of provided methods and algorithms, and Edward does the rest.
Within three hours, attendees learned about probabilistic reasoning that is the premise of Edward,
and they acquired the skills to address and solve a variety of inference problems themselves.

You can find the video recording of the tutorial on YouTube, [https://youtu.be/fR5Wvb86-IU](https://youtu.be/fR5Wvb86-IU). I also put the slides online, see [http://tscholak.github.io/assets/PyConEdward](http://tscholak.github.io/assets/PyConEdward/#/). Finally, the IPython notebook that was the handout for the tutorial, can be found on GitHub at [https://github.com/UnataInc/PyCon2017](https://github.com/UnataInc/PyCon2017).