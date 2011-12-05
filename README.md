What is TV Manager?
=======================
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

The other main view is **Unscheduled**, which lists any upcoming episodes that flagged as "unscheduled".  This is your TODO list for programming your DVR.

The rest of the app consists of data management views (add/edit/delete programs, series & episodes), basic reports (eg. "All recorded", "All Expected", "All Missed" etc.), and some utility functions such as importing/exporting the database to/from a JSON file etc.

Screenshots
===========

![Schedule](http://scottohara.github.com/tvmanager/schedule.png "Schedule")

![Program List](http://scottohara.github.com/tvmanager/program-list.png "Program List")

![Episode List](http://scottohara.github.com/tvmanager/episode-list.png "Episode List")

![Edit Episode](http://scottohara.github.com/tvmanager/episode-edit.png "Edit Episode")

Architecture
============
As mentioned above, the app is purely a HTML5 web application.

It was developed with the iPhone in mind, so the styling is very "iPhone-ish"; however it runs on any WebKit-based browsers (mobile or desktop) that support client-side storage (eg. runs great in Chrome on the desktop).

It uses the HTML5 application cache, so it continues to function when offline/disconnected.

The code uses an MVC-style architecture, with a custom "view stack" for navigating through the screens (ie. opening a view 'pushes' it onto the top of the stack; closing the view 'pops' it off the stack, revealing the previous view underneath).

Database schema changes are managed via an upgrade routine on startup (similar to Rails-style migrations).

On the server side, it's a Ruby Sinatra app.  There's not much happening on the server though, the only things are a dynamically-generated cache manifest file used for the HTML5 application cache, and import/export services that allows the client-side HTML5 WebSQL database to be backed up/restored (BYO Amazon S3 account).

[jQuery](http://jquery.com/) is used throughout, for DOM manipulation & AJAX calls.

[QUnit](http://docs.jquery.com/Qunit) is used for unit testing.

[JSCoverage](http://siliconforks.com/jscoverage/) is used to measure unit test code coverage.

[nodelint](http://github.com/tav/nodelint) is used to run JSLint over the entire code base.

Requirements
============
* WebKit-based browser, with HTML5 database support
* Somewhere to host the Ruby app and public HTML/JS/CSS files (recommend [Heroku](http://heroku.com) or similar)

Installation
==========================
1. Deploy the application to your chosen server (eg. git push heroku master)
2. Point your browser at /index.html
(Tip: On the iPhone, use the "Add to Home Screen" option to create a permanent icon that runs the app in fullscreen mode without the Safari chrome)

The first time it runs it will create the database (you should receive a message saying that the database has been upgraded, and to restart the app).

Offline Mode
============
HTML5 application caching uses a manifest file to indicate which files are allowed to be cached.  If the manifest file changes (in any way), all cached resources are refreshed from the server.

To avoid having to manually keep the manifest file up to date with new/changed files, it is dynamically generated on the server using the [Manifesto gem](https://github.com/johntopley/manifesto).

You can test that the application cache is working by disconnecting from the network (or turning your mobile device to flight mode); and if everything goes well you should be able to continue using the app even though you're disconnected.

Import/Export
=============
The app includes a rudimentary backup/restore facility.  Backing up the database simply serializes all of the data to a JSON-respresentation, and saves it to an Amazon S3 account that you configure on the server.

The S3 bucket is configured with versioning enabled, meaning that each exported version is retained in S3 (Note: this means it is up to you to purge any old versions that you no longer wish to keep, as the app itself does not expire or remove previous backups).

Restoring the database does the reverse, pulling the latest JSON file (database.json) from S3 (via the server), clearing any existing data from the database and reloading it from the JSON.

An MD5 checksum veries that the data was imported/exported succesfully.

To enable the Import/Export functionality, you will need to declare the following environment variables:

* AMAZON_ACCESS_KEY_ID={your AWS access credentials}
* AMAZON_SECRET_ACCESS_KEY={your AWS secret key}
* S3_ENDPOINT={optional, the S3 region to use. Defaults to s3.amazonaws.com if none specified}
* S3_BACKUP_BUCKET={the bucket to use for storing backup data. Will be created automatically if doesn't exist. See important note below.}
* S3_BACKUP_OBJECT={the object key for the backup, eg. 'production/database.json'.  See note below.}

**IMPORTANT NOTE REGARDING S3 BUCKET:** Versioning will be automatically enabled on the bucket specified above.  If you choose to backup to an existing bucket, please be aware that any other keys in this bucket will become version-enabled. Each version of an S3 object is counted when calculating your storage usage, so if you have a large bucket and/or it is written to frequently; then be aware that your storage could increase dramatically.  Recommend that you specify a bucket that will be used exclusively by TV Manager, to avoid any issues.

For the object key, you may wish to include the deploy/environment as part of the key. This enables you to have development, staging and production databases backed up to a single bucket (eg. 'development/database.json', 'staging/database.json', 'production/database.json').

In development, the above environment variables can be saved to a file (eg. ~/.aws), which can then be sourced in your shell profile (eg. ~/.profile, ~/.bashrc, ~/.zshrc), eg.

**~/.aws**
```export AMAZON_ACCESS_KEY_ID='your AWS access credentials'
export AMAZON_SECRET_ACCESS_KEY='your AWS secret key'
export S3_ENDPOINT='s3-ap-southeast-1.amazonaws.com'
export S3_BACKUP_BUCKET='tvmanager-yourdomain.com'
export S3_BACKUP_OBJECT='development/database.json'```

**~/.profile**
```AWS=~/.aws
if [ -f $AWS ]; then
	. $AWS
fi```

For staging/production, if you use Heroku you can specify these config vars using the heroku CLI gem, eg.
	heroku config:add AMAZON_ACCESS_KEY_ID=your_AWS_access_credentials AMAZON_SECRET_ACCESS_KEY=your_AWS_secret_key (etc..) S3_BACKUP_OBJECT=staging/database.json --remote staging
	heroku config:add AMAZON_ACCESS_KEY_ID=your_AWS_access_credentials AMAZON_SECRET_ACCESS_KEY=your_AWS_secret_key (etc..) S3_BACKUP_OBJECT=production/database.json --remote production

(Assumes you have setup two Heroku remotes, one for staging and one for production)

Test Suite
==========
To run the entire QUnit test suite, simply browse the test/index.html page

To run a single QUnit test module, browse test/index.html?module-name  (eg. test/index.html?application-controller)

Once the test suite is passing cleanly, to check the test suite coverage:

* install [JSCoverage](http://siliconforks.com/jscoverage/)
* create a sibling folder to your repository, called {REPO_NAME}Coverage (eg. if your repo is in ~/tvmanager, create a folder called ~/tvmanagerCoverage)
* execute the test/generate-coverage.sh shell script, which creates an 'instrumented' copy of the code in the above location
* browse to ../{REPO_NAME}Coverage/jscoverage.html?test/index.html&missing=true
* on the Summary tab, check that we have >=99% total coverage

Coverage Exceptions:

* database-controller.js (96%): 2 lines that handle upgrading to an earlier version are not tested
* episodes-controller.js (98%): 1 line that sets the jQueryUI sortable helper offset is not tested
* database-mock.js (97%): 2 lines that handle malformed SQL commands (mismatched parameters & tokens) are not tested

To run lint:

* install [nodelint](http://github.com/tav/nodelint)
* exec the test/run-lint.sh shell script
