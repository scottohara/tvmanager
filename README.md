[![Build Status](https://travis-ci.org/scottohara/tvmanager.png)](https://travis-ci.org/scottohara/tvmanager)
[![Code Climate](https://codeclimate.com/github/scottohara/tvmanager.png)](https://codeclimate.com/github/scottohara/tvmanager)

What is TV Manager?
===================
TV Manager is a HTML5 webapp that keeps track of which episodes of your favourite TV shows you:

* have seen,
* have recorded to your DVR (or downloaded by other means),
* expect to be broadcast in the near future, or
* missed

The data model is very simple:
**Programs consist of zero or more Series, which consist of zero or more Episodes.**

**Programs** simply have a name (eg. "Lost")

**Series** have a name (eg. "Series 1" or "Season 1") and optionally a broadcast frequency (eg. "Daily" or "Mondays" or "Tuesdays", etc.)

**Episodes** have a name, a status (eg. Watched/Recorded/Expected/Missed), a date (ie. *when* the episode was recorded/expected/missed), plus some attributes to indicate whether it is unverified (eg. you *think* this is the eposide you recorded, but you're not 100% sure) or unscheduled (don't forget to set your DVR!)

The main view is the **Schedule**, which lists all series that are currently airing (ie. have a frequency other than "Not Showing"), plus any other series that may not be currently airing but have one or more recorded or upcoming episodes expected.

The other main view is **Unscheduled**, which lists any upcoming episodes that flagged as "unscheduled". This is your TODO list for programming your DVR.

The rest of the app consists of data management views (add/edit/delete programs, series & episodes), basic reports (eg. "All recorded", "All Expected", "All Missed" etc.), and some utility functions such as importing/exporting the database to/from a backend NoSQL database (CouchDB) etc.

Screenshots
===========

![Schedule](http://scottohara.github.io/tvmanager/schedule.png "Schedule")

![Program List](http://scottohara.github.io/tvmanager/program-list.png "Program List")

![Episode List](http://scottohara.github.io/tvmanager/episode-list.png "Episode List")

![Edit Episode](http://scottohara.github.io/tvmanager/episode-edit.png "Edit Episode")

Architecture
============
As mentioned above, the app is purely a HTML5 web application.

It was developed with the iPhone in mind, so the styling is very "iPhone-ish"; however it runs on any WebKit-based browsers (mobile or desktop) that support client-side storage (eg. runs great in Chrome on the desktop).

It uses the HTML5 application cache, so it continues to function when offline/disconnected.

The code uses an MVC-style architecture, with a custom "view stack" for navigating through the screens (ie. opening a view 'pushes' it onto the top of the stack; closing the view 'pops' it off the stack, revealing the previous view underneath).

Database schema changes are managed via an upgrade routine on startup (similar to Rails-style migrations).

On the server side, it's a Ruby Sinatra app. There's not much happening on the server though, the only things are a dynamically-generated cache manifest file used for the HTML5 application cache, and import/export services that allows the client-side HTML5 WebSQL database to be backed up/restored (BYO CouchDB database).

[jQuery](http://jquery.com/) is used throughout, for DOM manipulation & AJAX calls.

[require.js](http://requirejs.org) is used for asynchronous module loading.

[QUnit](http://docs.jquery.com/Qunit) is used for unit testing.

[JSCoverage](http://siliconforks.com/jscoverage/) is used to measure unit test code coverage.

[jslint_on_rails](https://github.com/psionides/jslint_on_rails) is used to run JSLint over the entire code base.

[phantom.js](http://phantomjs.org) is used to run the unit test suite and code coverage headlessly.

[JSDoc3](http://usejsdoc.org) is used to generate API documentation.

Requirements
============
* WebKit-based browser, with HTML5 database support
* In development, Ruby/RubyGems/Bundler (recommend [RVM](http://beginrescueend.com/))
* In production/staging, somewhere to host the Ruby app and public HTML/JS/CSS files (recommend [Heroku](http://heroku.com) or similar)

Installation (Development)
==========================
1. Clone the repository (`git clone git://github.com/scottohara/tvmanager.git`)
2. Install the dependencies (`cd tvmanager && bundle install --path vendor/bundle`) (--path ensures that gems are installed locally in the project)
3. Start the server (`rackup`, or I prefer [shotgun](http://rtomayko.github.com/shotgun) as it automatically reloads as you make changes). Better yet, using [foreman](https://github.com/ddollar/foreman) and a Procfile, you can start the server and the CouchDB database in a single command (`foreman start -f Procfile.dev`)
2. Point your browser at /index.html
(Tip: On the iPhone, use the "Add to Home Screen" option to create a permanent icon that runs the app in fullscreen mode without the Safari chrome)

The first time it runs it will create the database (you should receive a message saying that the database has been upgraded, and to restart the app).

Deployment (Staging/Production)
===============================
If you use use heroku, it's a simple `rake deploy:staging` and `rake deploy:production`. These rake tasks assume that you have heroku remotes named staging and production configured; and you must create an annotated tag before deploying (eg. `git tag -a -m "Version 1.00" v1.00`); which is what will be pushed to heroku.

By default, the name of the client-side HTML5 database is "TVManager". Database names must be unique for the domain (origin), so in the event that you are hosting multiple environments under the same domain (eg. tvmanager.mydomain.com/production and tvmanager.mydomain.com/staging), you can override the default database name for one or both environments using an environment variable. For example, in development:

`export DATABASE_NAME='TVManagerDev'`

For staging/production, if you use Heroku:

`heroku config:add DATABASE_NAME=TVManagerStaging --remote staging`

The default database name doesn't need to be overriden if each environment is hosted under a separate domain (eg. tvmanager.mydomain.com and tvmanagerstaging.mydomain.com)

After deployment, if you are using the import/export functionality to backup/restore a CouchDB database, you should run `rake db:migrate` (see Import/Export below)

Offline Mode
============
HTML5 application caching uses a manifest file to indicate which files are allowed to be cached. If the manifest file changes (in any way), all cached resources are refreshed from the server.

To avoid having to manually keep the manifest file up to date with new/changed files, it is dynamically generated on the server using the [Manifesto gem](https://github.com/johntopley/manifesto).

You can test that the application cache is working by disconnecting from the network (or turning your mobile device to flight mode); and if everything goes well you should be able to continue using the app even though you're disconnected.

Note: In development, where files are constantly being modified, application caching can sometimes be a hindrance. You can disable application caching using the following environment variable:

`export TVMANAGER_NO_APPCACHE='true'`

For convenience, rake tasks are available that start the server with application caching enabled (`rake appcache:enable`) or disabled (`rake appcache:disable`), for quickly toggling between the two.

Import/Export
=============
The app includes a backup/restore facility. A log of all changes made to the local HTML5 database since the last export is kept, and when an export is initiated, those changes are serialized to a JSON-representation and sent to a CouchDB database configured on the server.

Restoring the database does the reverse, pulling JSON objects from CouchDB (via the server) and loading them into the local database.

Each client must first register itself with the server for the import/export feature to become available. Once registered, the first import is always a full import, clearing any existing data from the local database and reloading it with the JSON objects from CouchDB. After that, any subsequent imports will pull down only changes from the server (although a full import can be requested at any time, by turning off the "Fast Import" option).

Before a client is allowed to export changes to the server (to prevent unauthorised access to your data), the CouchDB admin must first permit the client. This is done by updating the client's "device" document in CouchDB, setting its "readOnly" attribute to false. Once this is done, the client can export any local changes or deletions to the server.

In the event of a conflict (i.e. an object modified/deleted both locally and on the server), the conflict is resolved in the direction that data is flowing. In other words: for exporting, local changes overwrite changes on the server; and for importing, changes on the server overwrite local changes.

An MD5 checksum verifies that the data was imported/exported succesfully.

To enable the Import/Export functionality, you will need to declare the following environment variable:

* TVMANAGER_COUCHDB_URL=http://{username}:{password}@{host}:{port}/{databasename}

In development, the above environment variables can be saved to a file (eg. ~/.tvmanager), which can then be sourced in your shell profile (eg. ~/.profile, ~/.bashrc, ~/.zshrc), eg.

**~/.tvmanager**

```
export TVMANAGER_COUCHDB_URL='http://user:pass@host:port/database'
```

**~/.profile**

```
TVMANAGER=~/.tvmanager
if [ -f $TVMANAGER ]; then
	. $TVMANAGER
fi
```

For staging/production, if you use Heroku you can specify these config vars using the heroku CLI gem, eg.

```
heroku config:add TVMANAGER_COUCHDB_URL=http://user:pass@host:port/tvmanager_staging --remote staging
heroku config:add TVMANAGER_COUCHDB_URL=http://user:pass@host:port/tvmanager --remote production
```

(Assumes you have setup two Heroku remotes, one for staging and one for production)

After creating an empty CouchDB database, you need to load the design documents from /db/design/*.json. You can load these manually using Futon or via a cURL script if you like, or there is rake task (`db:migrate`) that does this for you. You should run this rake task after each deployment, to ensure the latest design documents are being used.

To remind users to backup regularly, a warning prompt appears at startup if the last backup was more than 7 days ago.  You can override the number of days that this warning appears using the following environment variable:

`export TVMANAGER_MAX_DATA_AGE_DAYS=3`

The above setting would prompt the user to backup after three days instead of the default seven days. In development, it is useful to set this to a very high number (eg. 9999) so that you are not constantly prompted to backup.

Test Suite
==========
Before running the tests, ensure that the server is configured for testing (this prevents, for example, the unit tests for exporting/importing inadvertently overwriting your actual backups in CouchDB with test data, as test mode doesn't touch CouchDB at all).

To run the server in test mode:

* `rake test:client`

Alternatively, you can start the server manually using the -E argument (eg. `rackup -E test` or `shotgun -E test`). If you try running the unit tests when the server is not in test mode, you will be warned and prompted by your browser whether or not to continue.

To run the entire QUnit test suite, simply browse to [http://localhost:9393/test/index.html](http://localhost:9393/test/index.html)

To run a single QUnit test module, append '?module=module-name' (eg. [http://localhost:9393/test/index.html?module=application-controller](http://localhost:9393/test/index.html?module=application-controller))

Once the test suite is passing cleanly, to check the test suite coverage:

* install [JSCoverage](http://siliconforks.com/jscoverage/)
* run the test:coverage rake task (eg. `rake test:coverage`). This generates an instrumented copy of the code for tracking coverage.
* browse to [http://localhost:9292/jscoverage.html?test/index.html&missing=true](http://localhost:9292/jscoverage.html?test/index.html&missing=true) (Note: unlike the test:client task, which uses shotgun to start the server on a default port of 9393; the test:coverage task uses rackup on port 9292. For some reason, jscoverage wouldn't run properly using shotgun)
* on the Summary tab, check that we have 100% total coverage

To run lint:

* `rake jslint`

JSlint configuration options are set in config/jslint.yml

For headless testing from the command line:

* `rake test:headless:client` runs the Qunit test suite and writes any failed tests to stdout
* `rake test:headless:coverage` runs the JSCoverage statistics and displays any files that have less that total coverage to stdout
* `rake test:headless` runs JSLint, then the Qunit test suite, then the JSCoverage statistics

API Documentation
=================
The JavaScript source is fully annotated with JSDoc3 tags, allowing HTML documentation of the API to be automatically generated.

To generate documentation:

* install [JSDoc3](http://usejsdoc.org)
* run the docs:generate rake task (eg. `rake docs:generate`). This generates the documentation in the `/docs` directory of the project's root.
* browse to file://path_to_project/docs/index.html
