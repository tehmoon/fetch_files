fetch_files
===========

Simple tool to fetch all the files of a given url

Installation
------------

```bash
git clone https://github.com/tehmoon/fetch_files
cd fetch_files && npm install
```

Usage
-----

```bash
node app.s -d destDir -u url [-c custDir]
```

  * -d  Directory where the tmp dir is created
  * -u  Url to fetch
  * -c  The tmp dir is the date but you can set a custom name

Example
-------
```bash
node app.js -d . -u http://blog.nodejs.org
node app.js -d . -u http://www.reddit.com/r/gifs -c reddit-gifs
```

Bug tracker
-----------

  * Multi level is not supported (-d this/first/folder/is/not/created) which means that you have to created the dir first
  * only jpg gif or zip is supported but you can add more in the regex
