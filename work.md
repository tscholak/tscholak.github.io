---
layout: page
title: My work
---

Currently, I study coherent dipolar energy transfer between resonant levels of ultra-cold Rydberg atoms {% cite scholak2014spectral %}, specifically, of the non-radiative exchange of an excitation among a large number of randomly distributed atoms. I conduct large-scale numerical surveys on the statistics of clouds with a large number of atoms $N$ and compare them to results of established random matrix theories, Euclidean and stable random matrix theory, for instance. I also work on analytical treatments for the asymptotic limit, where $N \to \infty$.

During my PhD, I worked on excitonic energy transport in disordered networks {% cite scholak2011efficient scholak2011transport %}, in particular, pigment-protein complexes with strong dipole-dipole interactions. I employed evolution strategies to numerically optimize the energy transport in these systems. I got heavily involved in the ongoing debate on the mechanisms that drive efficient transport across photosynthetic complexes.

In the group of Paul Brumer, one of my main concerns has been the substantiation of quantum coherence effects in the control of atomic and molecular processes with lasers, i.e. quantum coherent control {% cite scholak2014certifying %}. To this end, I integrated coherent control ideas with concepts of quantum interferometry, in particular, the complementarity of waves and particles, suggesting the possibility to observe non-trivial quantum effects in new scenarios of two-color phase control.

* * *

<h2><a name="publications"></a>Publications</h2>

<h5>In preparation</h5>

{% bibliography --query @unpublished %}

<h5>Journal articles</h5>

{% bibliography --query @article %}

<h5>Book chapters</h5>

{% bibliography --query @inbook %}

<h5>Theses</h5>

{% bibliography --query @phdthesis @mastersthesis %}

* * *

<h2>Talks and posters</h2>

<img src="/assets/images/stylishposter.jpg" alt="2013 Gordon conference poster" class="full-img">

{% bibliography --query @misc[status=talk || status=poster] %}
