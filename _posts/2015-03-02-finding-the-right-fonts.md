---
layout: post
title:  "Finding the right fonts"
date:   2015-03-02 00:00:00
categories: update
---

Kasper, the theme that I am using for this web site, comes with three fonts: [Open Sans](http://www.google.com/fonts/specimen/Open+Sans), [Merriweather](http://www.google.com/fonts/specimen/Merriweather), and [Inconsolata](https://www.google.com/fonts/specimen/Inconsolata). I did not like these very much, so I set out to find suitable replacements. <span class="more"></span>

For the moment I settled on [Fira Sans](http://typographica.org/typeface-reviews/fira-sans/) for headlines, [Charter](http://practicaltypography.com/charter.html) for body text, and [Source Code Pro](https://github.com/adobe/source-code-pro) for code listings. These are the only free fonts recommended by [Butterick's Practical Typography](http://practicaltypography.com/bad-fonts.html). Charter is a serif typeface and was originally designed for late 1980s printers. It performs quite well on modern displays, retina and non-retina alike. I am indebted to Matthew Butterick for packaging Charter as a web font. Fira Sans was designed in 2013 by [Erik Spiekermann](https://www.youtube.com/watch?v=F691weEVpwc) et al. for Firefox OS. Source Code Pro is a community project initiated by Adobe. Fira Sans and Source Code Pro can be used through Google's web font service free of charge (barring some [privacy concerns](http://fontfeed.com/archives/google-webfonts-the-spy-inside/)).

Incidentally, all three fonts can be used in a LaTeX document:

    \usepackage[T1]{fontenc}
    \usepackage{charter}
    \usepackage[charter]{mathdesign}
    \usepackage{sourcecodepro}
    \usepackage[lf]{FiraSans}
