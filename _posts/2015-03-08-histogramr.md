---
layout: post
title:  "Meet histogramr"
date:   2015-03-08 00:00:00
categories: [code, "big data"]
---

histogramr is a piece of software that produces multivariate histograms from numerical data. I started working on histogramr during my PhD and have been using and improving it ever since. It has been instrumental in many of my scientific achievements {% cite scholak2010transport scholak2011efficient scholak2011optimization scholak2011optimal scholak2011disorder zech2013quantum scholak2014spectral %}, because it has allowed for the statistical analysis of extremely large scientific data sets. <span class="more"></span>

histogramr reads and writes [HDF5](http://www.hdfgroup.org/HDF5/) files. An HDF5 file is a hierarchical, file-system-like data structure arranged in groups of groups or data sets. Groups are like folders of a file system, and data sets are like files containing one- or multidimensional arrays of a single data type. The elements of a simple data set are just numbers, characters, or small arrays thereof, whereas the elements of more complex data sets have compounded types. HDF5 compounds are similar to [C structs](http://en.wikipedia.org/wiki/Struct_(C_programming_language)). Like them, they are composed of other data types. The elements of a compound type are called members, and they must be given unique names. histogramr works on compound member data only. The data can be from a single or a number of data sets in the file. From this data, the software generates a multivariate histogram, i.e. an approximate multivariate probability density function (PDF) discretized on a multidimensional rectangular regular grid of predefined shape. Each dimension of that grid corresponds to one compound member. histogramr offers control over the histogram limits, the binning (i.e. the grid spacing), and whether or not the input data is log-transformed prior to processing. histogramr stores the PDF in a simple data set of an HDF5 output file.

# histogramr is now on GitHub!

Today I release histogramr under the GPLv3 [on GitHub](https://github.com/tscholak/histogramr). You can download and use it for *free*. The easiest way to do so is by using [Git](http://git-scm.com). In Linux or Mac OS X, fire up a terminal and run:

```
$ git clone git@github.com:tscholak/histogramr.git
```

This downloads the most recent version of histogramr into the directory `histogramr`. After that, `cd` into that folder and run:

```
$ ./autogen.sh
$ ./configure
$ make
$ ln -sf "`pwd`/src/histogramr" ~/bin
```

You can now [use histogramr](#usage) for your own data. Or, since you've got the source code, you can change histogramr or use pieces of it in new free software.

# <a name="usage"></a>Usage

histogramr reads in the input files one-by-one and commits the data to the histogram data structure. The output file is written multiple times, whenever a predetermined number of input files has been processed. Below the output of `histogramr --help`:

```
histogramr: create multivariate histograms of continuous data

Usage: histogramr -d <dsname1> -m <mname1[:mname2...]>
  -b <size1[:size2...]> -l <range1[:range2...]>
  [-L <boolean1[:boolean2...]>] [-d <dsname2> ...] [-e <number>]
  -o <outfile> <infile1> [<infile2> ...]

Mandatory options:
  -d, --dataset <dsname>     data set(s) must be specified first
  -m, --member <mname>       data set member(s)
  -b, --binning <size>       histogram binning(s)
  -l, --limit <range>        histogram limits
  -o, --output <outfile>     name the output file

Optional options:
  -e, --save-every <number>  save every <number> of files
                             (default: 1)
  -L, --l10 <boolean>        logarithmic transform (default: false)

Other options:
  -h, --help                 print this help message and quit
  -v, --version              print version information and quit

Report bugs to: torsten.scholak+histogramr@googlemail.com
histogramr home page: <https://github.com/tscholak/histogramr>
```

I will provide real-life examples of big-data work-flows with histogramr in another blog post.

# Impact

So far, histogramr has processed data for the following publications:

{% bibliography --cited %}
