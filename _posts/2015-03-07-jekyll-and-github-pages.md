---
layout: post
title:  "Jekyll and GitHub Pages"
date:   2015-03-07 00:00:00
categories: [update, guide, jekyll]
---

By the time you read this, I will have tossed my old obsolete [Wordpress website](wordpress) in favor of this one, a modern [Jekyll](jekyll) powered [GitHub](github) page. I have started from scratch. The old site didn't have enough content worth rescuing. Unfortunately, I never found the ambition or the time to write blog posts. Of course, this is going to change now. <span class="more"></span> I'm sure. This article is just the beginning. It's like ... me and blogging forever ... and ever. A hundred years me and blogging ... about some things. Something all day long. [Forever a hundred times ...](http://www.adultswim.com/videos/rick-and-morty/) 

Err, ok. So, what are Jekyll and GitHub, and why should *you* care?

Let's first talk about Jekyll. Jekyll is a static blog generator. And it is awesome. Well, that seems to be the consensus of an [ever-growing hacker crowd](jekyll-examples) on the web that uses Jekyll for blogging. Indeed, after the initial hassle to set it up and to customize it to your liking, it allows for a very efficient work-flow. I am writing these lines in [Sublime](sublime) on my laptop using the [Markdown](markdown) markup language. Later, when I'm done (i.e., from your point of view, in the past), I invoke a short series of terminal commands to submit the article to my blog, where it immediately appears for everybody to read. The work-flow is similar to writing, compiling, and deploying program code.

<img src="/assets/images/sublime.jpg" alt="working hard on this blog post" class="full-img">

[GitHub Pages](gh-pages) are public web pages hosted by GitHub, a private Git repository hosting service. Word has it that GitHub is awesome, too. Several reasons for that come to mind. First, hosting on GitHub is free. If you can live with a static web page and the github.io domain, then GitHub is definitely worth a look. Second, the setup of a GitHub page is fairly easy. If you are familiar with the process of setting up GitHub repositories, then you already know everything you need to know about GitHub Pages. And third, [GitHub runs Jekyll](gh-pages-jekyll) automatically on your uploaded Markdown code. It converts it into shiny static HTML that's on-line instantly. All this magic would not be possible without a few limitations, though. For instance, for security reasons, GitHub supports only a few hand-selected Jekyll plugins. Check [here](gh-jekyll-supported) to see if your favorite Jekyll plugin is among them. If it's not, then think for a moment or two if you truly need it. In the affirmative, I'm afraid, you will have to resort to some nifty shenanigans to get what you want. This is the path I recently ventured on, and, for what it's worth, I dedicate the rest of this article to outlining my solution.

[wordpress]:           https://tscholak.wordpress.com
[github]:              https://github.com
[gh-pages]:            https://pages.github.com
[gh-pages-jekyll]:     https://help.github.com/articles/using-jekyll-with-pages/
[gh-jekyll-supported]: https://pages.github.com/versions/
[jekyll]:              http://jekyllrb.com
[jekyll-examples]:     https://github.com/jekyll/jekyll/wiki/Sites
[sublime]:             http://www.sublimetext.com
[markdown]:            http://daringfireball.net/projects/markdown/

* * *

# Unsupported Jekyll plugins

So, how exactly can you use custom Jekyll plugins on GitHub Pages?

There is of course ample prior work on that subject, and I make no secret that I borrowed heavily from [earlier](http://www.aymerick.com/2014/07/22/jekyll-github-pages-bower-bootstrap.html) [howtos](http://james-oldfield.co/blog/jekyll-plugins-with-gh-pages/) [and](http://paulstamatiou.com/responsive-retina-blog-development-part-1/) [tutorials](https://blog.5apps.com/2014/05/29/deploying-static-apps-with-grunt-build-control-on-5apps-deploy.html) in order to combine them into something elegant that works for me *personally*. However, by my estimates, there is a finite chance that my solution is the right one for you, too. This is one reason I decided to write it up. The other reason is that I want to help out future me who indubitably will have forgotten all this stuff.

At the heart of the solution is *local* Jekyll processing. Yes, we are going to opt out of the awesome Jekyll processing on GitHub. We do this despite the fact that local Jekyll processing is, done wrong, unbearably tedious. The good news is that there exist sophisticated automation tools that will help to keep us calm.

## Bower and Grunt to the rescue

Below, we discuss two automation tools, a build tool called Grunt and a package manager called Bower.

[Bower](http://bower.io) is a lightweight package management system for the web that depends on [Node.js](http://nodejs.org) and [npm](https://www.npmjs.com), the package manager for Node.js. Bower helps with installing vendor provided client-side scripts, for instance [jQuery](http://jquery.com), [Bootstrap](http://getbootstrap.com), or [Handlebars](http://handlebarsjs.com). This is software your web site will most likely be built on. 

[Grunt](http://gruntjs.com) is an automation tool that assists you with repetitive tasks, i.e. tasks like building and deploying a Jekyll powered web page. It fulfills a similar purpose as that of [GNU make](http://www.gnu.org/software/make/). The similarity is apparent from the way Grunt and GNU make are fed instructions. `make` executes rules and commands from a `Makefile`, and `grunt` gets its instructions from a `Gruntfile`. However, the syntax of these files is completely different. But more about that later.

Bower and Grunt are part of the illustrious [Yeoman work-flow](http://yeoman.io) that also includes a CLI tool called [yo](https://github.com/yeoman/yo). We won't be needing yo in the following, though.

## The basics

The first step is to install Jekyll and Node.js on your computer. I am running Mac OS X and the [MacPorts](https://www.macports.org) package management system on mine. Although my notes address this particular environment, you should be able to make use of most of the instructions also on other platforms and with different package managers. To this end, you will need to work in the terminal. And, you will need root privileges.

```
lipbite:~ tscholak$ sudo port selfupdate
lipbite:~ tscholak$ sudo port install py27-pygments nodejs npm
lipbite:~ tscholak$ sudo gem install \
>   github-pages \
>   jekyll \
>   jekyll-redirect-from \
>   jekyll-scholar \
>   kramdown \
>   rdiscount \
>   rouge \
>   redcarpet
```

Running these commands updates the MacPorts ports tree, installs Node.js with npm, and prepares Jekyll with some extensions. (Mac OS X Yosemite ships with [Ruby 2.0](https://www.ruby-lang.org/en/) as the default, there is no need to mess with that.) All these packages are installed system-wide. This may not be what you want, especially if you [don't trust unsigned software](http://stackoverflow.com/questions/4938592/how-why-does-npm-recommend-not-running-as-root#answers).

The [Jekyll-Scholar](https://github.com/inukshuk/jekyll-scholar) plugin is an awesome way to create bibliographies. I use it [here](/work.html#publications). It is not available on GitHub Pages and may be reason enough for you to switch to local processing.

Let us now create a new, empty Jekyll instance somewhere in the home folder:

```
lipbite:~ tscholak$ jekyll new tscholak.github.io
New jekyll site installed in /Users/tscholak/tscholak.github.io.
```

I chose the name `tscholak.github.io` because it's the address of my personal page (this page) and also the name of its GitHub repository. For you, it will be `[username].github.io`, where `[username]` is your GitHub user name. Next we create an empty git repository in that folder and add all existing files to it:

```
lipbite:~ tscholak$ cd tscholak.github.io
lipbite:tscholak.github.io tscholak$ git init
Initialized empty Git repository in /Users/tscholak/tscholak.github.io /.git/
lipbite:tscholak.github.io tscholak$ git add .
lipbite:tscholak.github.io tscholak$ git commit -m "Generated by Jekyll"
lipbite:tscholak.github.io tscholak$ git remote add origin git@github.com:tscholak/tscholak.github.io.git
```

The last line connects the local repository to a remote one. In this example, the remote is my GitHub Pages repository. It is given the label `origin`.

GitHub expects to find the processed, static HTML code in the `master` branch of the repository. That means whatever is in `master` will be displayed at `http://tscholak.github.io`. All other branches are ignored. We can thus use another branch, say, `source`, to store the source code of the page. This is the subject of the next section.

### Set up the `source` branch

First, we have to create the `source` branch. We use the local copy of `master` as a starting point:

```
lipbite:tscholak.github.io tscholak$ git checkout -b source master
Switched to a new branch ‘source'
```

Calling `git checkout` with the argument `-b` first creates and then switches to the new branch. It is the same as first calling `git branch` and then git-checking it out.

Now is a good time to make sure that your remote repository `[username].github.io` actually exists on GitHub. If it does not, go to `https://github.com/[username]` and [create it](https://help.github.com/articles/creating-a-new-repository/). Furthermore, in order to establish a secure connection between your computer and GitHub, you have to [review your SSH keys](https://help.github.com/articles/keeping-your-ssh-keys-and-application-access-tokens-safe/) and, if necessary, [add your local key to your GitHub account](https://help.github.com/articles/generating-ssh-keys/). You will also need to configure the `ssh-agent` program:

```
lipbite:tscholak.github.io tscholak$ eval "$(ssh-agent -s)"
Agent pid 9829
lipbite:tscholak.github.io tscholak$ ssh-add ~/.ssh/id_rsa
Identity added: /Users/tscholak/.ssh/id_rsa (/Users/tscholak/.ssh/id_rsa)
```

[ssh-agent](https://en.wikipedia.org/wiki/Ssh-agent) is a secure key chain for your private SSH keys. It comes with your Mac. The last command adds the private RSA key in your home folder to the chain. You may be asked to enter its passphrase.

Let us now test the connection by pushing the `source` branch to `origin`:

```
lipbite:tscholak.github.io tscholak$ git push -u origin source
Counting objects: 23, done.
Delta compression using up to 8 threads.
Compressing objects: 100% (21/21), done.
Writing objects: 100% (23/23), 8.55 KiB | 0 bytes/s, done.
Total 23 (delta 1), reused 0 (delta 0)
To git@github.com:tscholak/tscholak.github.io.git
 * [new branch]      source -> source
Branch source set up to track remote branch source from origin.
```

Your output should look like this or similar. Now go to GitHub and verify that your Jekyll instance has found its way to the server. Since you are there, I recommend making the `source` branch the default on GitHub. Consult [this link](https://help.github.com/articles/setting-the-default-branch/) for instructions.

### Set up the `master` branch

Next we need to wipe the `master` branch. The most thorough way to do this is to first delete and then to recreate it. We couldn't have done this before the `source` branch was created because GitHub doesn't allow you to delete the last remaining branch. We issue:

```
lipbite:tscholak.github.io tscholak$ git branch -D master
Deleted branch master (was e161a95).
lipbite:tscholak.github.io tscholak$ git push origin :master
To git@github.com:tscholak/tscholak.github.io.git
 - [deleted]         master
```

That gets rid of `master` both locally and remotely. Next we create a new, orphaned `master` branch. In the git jargon, orphaned means not derived or inherited from anything else.

```
lipbite:tscholak.github.io tscholak$ git checkout --orphan master
Switched to a new branch 'master'
lipbite:tscholak.github.io tscholak$ git reset .
```

The latter command is the opposite of `git add .` and can reverse its effect. Since `master` is empty, it puts the index (the next proposed commit snapshot) into an equally empty state. It remains to clear the working directory:

```
lipbite:tscholak.github.io tscholak$ rm -r *
lipbite:tscholak.github.io tscholak$ rm .gitignore
```

`master` is now a clean slate. Let us push it to GitHub:

```
lipbite:tscholak.github.io tscholak$ git commit -m "clean slate"
lipbite:tscholak.github.io tscholak$ git push -u origin master
```

If you go now to GitHub, you will find that `master` has been added, and, in contrast to `source`, is completely empty. We are done here, we can switch back to the `source` branch:

```
lipbite:tscholak.github.io tscholak$ git checkout source
Switched to branch 'source'
```

### Checking out `master` into `_site`

On GitHub we have separated the unprocessed web site source and the processed web site code into two different branches. Locally, we will also need to separate them somehow. There is an obvious way to do that. When you run `jekyll build` on your Jekyll instance (from within your local `~/[username].github.io` directory), the generated site is saved into the `~/[username].github.io/_site` folder. This is were we will checkout the `master` branch into:

```
lipbite:tscholak.github.io tscholak$ git clone git@github.com:tscholak/tscholak.github.io.git -b master _site
```

Next we want to let Jekyll build the web site. To this end, we need to update the `baseurl` configuration option (learn about it [here](https://byparker.com/blog/2014/clearing-up-confusion-around-baseurl/)) in Jekyll's `_config.yml` file. It needs to read `/` because we are deploying a GitHub User Page. On this occasion, we also might want to adjust the `url` and the `domain_name` variable:

```yaml
baseurl: /
domain_name: 'http://tscholak.github.io'
url: 'http://tscholak.github.io'
```

We can now build the site:

```
lipbite:tscholak.github.io tscholak$ jekyll build
```

You should preview it in your browser using:

```
lipbite:tscholak.github.io tscholak$ jekyll serve
```

If everything checks out, switch to the `_site` folder and push the result to GitHub:

```
lipbite:tscholak.github.io tscholak$ cd _site
lipbite:_site tscholak$ ls
about   css   feed.xml  index.html  jekyll
lipbite:_site tscholak$ git add .
lipbite:_site tscholak$ git commit -m "first build"
```

Now browse to `http://[username].github.io`. Your web page should be displayed exactly as it has been from your local Jekyll server.

### Turning off Jekyll on GitHub

Since our primary goal is to replace remote by local Jekyll processing, we need to disable the former. The people from GitHub explain how that can be achieved in a [short support article](https://help.github.com/articles/using-jekyll-with-pages/index.html#turning-jekyll-off). Following this article, we first have to add an empty `.nojekyll` file to the Jekyll instance:

```
lipbite:tscholak.github.io tscholak$ touch .nojekyll
```

Whenever we invoke `jekyll build`, we need Jekyll to copy that file to the `_site` folder. Thus, second, to make Jekyll aware of the file, we need to add

```yaml
include:
  - ".nojekyll"
```

to `_config.yml`.

This concludes the first part of this tutorial. We can now use Jekyll plugins with GitHub Pages. However, with this basic configuration, whenever we wish to deploy changes to the GitHub Page, we need to do four different things:

1. run `git add -A && git commit -m "[message]" && git push` in the local Jekyll instance to push the changes to the remote `source` branch,
2. invoke `jekyll build` to commence processing of the changes,
3. then switch to the `_site` directory, and finally
4. run `git add -A && git commit -m "[another_message_referencing_the_first_message]" && git push` again from there to push also the regenerated static files.

Note that, in step 1, Git ignores everything under `_site`, because that folder is not tracked by default (have a look into `.gitignore`).

Having to complete four steps every time you make a change may be a nuisance to you. It certainly is for me. With automation, we can replace the steps 2 to 4 by a single command: `grunt deploy`.

## Set up Bower

Before I talk about Grunt, I want to introduce you to Bower, the packet manager. I use Bower to manage vendor provided software, in particular, jQuery. Setting up Bower before we turn to Grunt has the advantage to have Bower tied neatly into Grunt from the very beginning. Indeed, Bower and Grunt play very well together. Grunt is ideal for making sure that the Jekyll build is not polluted by dead weight coming with third-party software.

Bower is installed using npm:

```
lipbite:~ tscholak$ sudo npm install -g bower
```

It is configured using the `bower init` command:

```
lipbite:tscholak.github.io tscholak$ bower init
? name: tscholak.github.io
? version: 0.0.0
? description: Meticulous Disorder
? main file: 
? what types of modules does this package expose?: node
? keywords: 
? authors: Torsten Scholak <torsten.scholak@googlemail.com>
? license: MIT
? homepage: https://github.com/tscholak/tscholak.github.io
? set currently installed components as dependencies?: Yes
? add commonly ignored files to ignore list?: Yes
? would you like to mark this package as private which prevents it from being accidentally published to the registry?: Yes
```

Answering these questions in the above way lets you end up with a `bower.json` file native to the `tscholak.github.io` directory with the following content:

```json
{
  "name": "tscholak.github.io",
  "version": "0.0.0",
  "homepage": "https://github.com/tscholak/tscholak.github.io",
  "authors": [
    "Torsten Scholak <torsten.scholak@googlemail.com>"
  ],
  "description": "Meticulous Disorder",
  "moduleType": [
    "node"
  ],
  "license": "MIT",
  "private": true,
  "ignore": [
    "**/.*",
    "node_modules",
    "bower_components",
    "test",
    "tests"
  ]
}
```

Keep it like that (or similar). With these settings in place, packages can be installed from within the `tscholak.github.io` directory with `bower install`. So far, on my page, I use [jQuery](http://jquery.com), [jQuery UI](http://jqueryui.com), [FitVids.js](http://fitvidsjs.com), and [Lettering.js](http://letteringjs.com). Let's pretend you also have a need for these:

```
lipbite:tscholak.github.io tscholak$ bower install jquery jquery-ui fitvids letteringjs --save
```

The components (and their auxiliary payload) are installed into `./bower_components`. Since the Bower components, including `bower.json`, should not end up on-line on your web page, we need to exclude them from the Jekyll build. Edit `_config.yml` and add:

```yaml
exclude:
  - "bower_components"
  - "bower.json"
```

Git should also be unaware of Bower. We can make it ignore the Bower components by adding the following line to the `.gitignore` file:

```
/bower_components/
```

## Set up npm

npm, the package manager of the Node.js project, is needed for Grunt. Its configuration is similar to that of Bower. First we execute:

```
lipbite:tscholak.github.io tscholak$ npm init
```

Like Bower, npm will ask you a couple of question. I answered them like this:

```
name: (tscholak.github.io) 
version: (1.0.0) 0.0.0
description: Meticulous Disorder
entry point: (index.js) _site/index.html
test command: 
git repository: (https://github.com/tscholak/tscholak.github.io.git) 
keywords: 
author: Torsten Scholak <torsten.scholak@googlemail.com>
license: (ISC) MIT
```

It should be easy for you to find the answers that fit your case. They will be saved to the file `package.json` in your `[username].github.io` folder. Like Bower components, Node.js modules should not end up on the web. These files can be excluded from the Jekyll build by adding

```
  - "node_modules"
  - "package.json"
```

to the `exclude` section of your `_config.yml` file. Furthermore, Git will ignore the Node.js files only if you add `/node_modules/` to `.gitignore`.

## Set up Grunt

We are now finally ready to set up the Grunt build system. First, we install a system-wide [command line interface for grunt](https://www.npmjs.com/package/grunt-cli#readme):

```
lipbite:tscholak.github.io tscholak$ sudo npm install -g grunt-cli
```

Then we install Grunt and a few of its plugins into our project folder:

```
lipbite:tscholak.github.io tscholak$ npm install \
>   grunt \
>   grunt-bower-task \
>   grunt-contrib-connect \
>   grunt-contrib-copy \
>   grunt-contrib-watch \
>   grunt-exec \
>   grunt-build-control --save-dev
```

Let me quickly iterate on all these packages:

* [grunt-bower-task](https://www.npmjs.com/package/grunt-bower-task#readme) lets you automatize the installation of Bower packages. I'm not using it yet, but plan to do so. A possible use case is discussed [here](https://www.erianna.com/better-asset-management-with-bower#integrating-bower-with-grunt).
* [grunt-contrib-connect](https://www.npmjs.com/package/grunt-contrib-connect#readme) lets you start a web server. It can replace `jekyll serve`.
* [grunt-contrib-copy](https://www.npmjs.com/package/grunt-contrib-copy#readme) can be used to copy files and folders.
* [grunt-contrib-watch](https://www.npmjs.com/package/grunt-contrib-watch#readme) runs a predefined task whenever it detects changes in the watched files and folders. For instance, in combination with a build task, it can replace `jekyll build --watch`.
* [grunt-exec](https://www.npmjs.com/package/grunt-exec#readme) is a simple plugin for executing external commands.
* [grunt-build-control](https://www.npmjs.com/package/grunt-build-control#readme) is a brilliant plugin that helps you deploy built code to GitHub.

The setup of Grunt is concluded by adding a [Gruntfile](http://gruntjs.com/getting-started#the-gruntfile) to our project. Our Gruntfile will be named `Gruntfile.js` and will be written in JavaScript. We exclude it from the Jekyll build by adding

```yaml
  - "Gruntfile.js"
```

to `_config.yml` in the exclude section. The contents of the `Gruntfile.js` should look like this:

```javascript
module.exports = function(grunt) {

  grunt.initConfig({
    copy: {
      jquery: {
        files: [{
          expand: true,
          cwd: 'bower_components/jquery/dist/',
          src: 'jquery.min.js',
          dest: 'vendor/js/',
        }]
      },
      jqueryui: {
        files: [{
          expand: true,
          cwd: 'bower_components/jquery-ui/',
          src: 'jquery-ui.min.js',
          dest: 'vendor/js/',
        }]
      },
      fitvids: {
        files: [{
          expand: true,
          cwd: 'bower_components/fitvids/',
          src: 'jquery.fitvids.js',
          dest: 'vendor/js/',
        }]
      },
      lettering: {
        files: [{
          expand: true,
          cwd: 'bower_components/letteringjs/',
          src: 'jquery.lettering.js',
          dest: 'vendor/js/',
        }]
      }
    },
    exec: {
      jekyll: {
        cmd: 'jekyll build --trace'
      },
      jekyll_drafts: {
        cmd: 'jekyll build --trace --drafts'
      }
    },
    watch: {
      source: {
        files: [
          '_config.yml',
          '_drafts/**/*',
          '_includes/**/*',
          '_layouts/**/*',
          '_plugins/**/*',
          '_posts/**/*',
          '_sass/**/*',
          'assets/**/*',
          '*.html',
          '*.md',
          'feed.xml'
        ],
        tasks: ['exec:jekyll_drafts'],      
        options: {
          livereload: true
        }
      }
    },
    connect: {
      server: {
        options: {
          port: 4000,
          base: '_site',
          livereload: true
        }
      }
    },
    buildcontrol: {
      options: {
        dir: '_site',
        commit: true,
        push: true,
        message: 'Built %sourceName% from commit %sourceCommit% on branch %sourceBranch%'
      },
      pages: {
        options: {
          remote: 'git@github.com:tscholak/tscholak.github.io.git',
          branch: 'master'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-bower-task');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-build-control');

  grunt.registerTask('build', ['copy', 'exec:jekyll']);
  grunt.registerTask('build_drafts', ['copy', 'exec:jekyll_drafts']);
  grunt.registerTask('serve', ['build_drafts', 'connect:server', 'watch']);
  grunt.registerTask('deploy', ['build', 'buildcontrol:pages']);
  grunt.registerTask('default', ['deploy']);

};
```

Let me attempt a short explanation for each of the tasks defined in that file:

* `grunt connect:server` starts the web server from the grunt-contrib-connect plugin. According to the above options, the web server responds on port 4000 and serves files from the `_site` directory.
* `grunt copy` copies the specified Bower JavaScript components to the `vendor/js` directory. That directory will be copied as is by Jekyll to `_site`. It doesn't make sense to push `vendor` to the `source` branch. You may exclude it from Git by adding `/vendor/` to an empty line in the `.gitignore` file.
* `grunt exec:jekyll` calls `jekyll build` to build the site into `_site` directory. `grunt exec:jekyll_drafts` also includes documents in the `_drafts` folder into the build.
* `grunt watch` calls `grunt exec:jekyll_drafts` upon source file changes. Which files are watched is specified with the `files` option. The `livereload` option causes your web browser to refresh the site after a rebuild is triggered.
* The `buildcontrol:pages` subtask deploys the `_site` directory to the `master` branch on GitHub. Safety checks to make sure the source repository is clean, so that built code always corresponds to a source code commit. (i think, that means that the content of `_site` has to correspond always to a `jekyll build` run on the last commit of the `source` branch.)

The last couple of lines register new aliases for a task or a list of tasks that are executed in the order of their appearance.

## Test Grunt configuration

If everything is according to plan, then Grunt should now be able build and deploy the Jekyll page. Let us test these functions. Run:

```
lipbite:tscholak.github.io tscholak$ grunt -v build
```

Have a look at the verbose output and look for errors. If everything checks out, try:

```
lipbite:tscholak.github.io tscholak$ grunt -v serve
```

and fire the page up in your browser. If you are satisfied with the result, abort the server and run the following:

```
lipbite:tscholak.github.io tscholak$ git add -A 
lipbite:tscholak.github.io tscholak$ git commit -m "[message]"
lipbite:tscholak.github.io tscholak$ git push origin source
lipbite:tscholak.github.io tscholak$ grunt -v deploy
```

And boom, your static page is on-line on GitHub Pages!

We've now got everything we came for. This setup allows you to build your Jekyll site with whatever plugin (or Ruby code) you like. The site is generated locally and then deployed to GitHub.

* * *

# Further Remark(s)

* If you are working in Sublime Text like me, you may want to install [sublime-grunt](https://github.com/tvooo/sublime-grunt), available via Package Control.
* tbc ...
