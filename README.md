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

The other main view is **Unscheduled**, which lists any upcoming episodes that flagged as "unscheduled". This is your TODO list for programming your DVR.

The rest of the app consists of data management views (add/edit/delete programs, series & episodes), basic reports (eg. "All recorded", "All Expected", "All Missed" etc.), and some utility functions such as importing/exporting the database to/from Amazon S3 etc.

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

On the server side, it's a Ruby Sinatra app. There's not much happening on the server though, the only things are a dynamically-generated cache manifest file used for the HTML5 application cache, and import/export services that allows the client-side HTML5 WebSQL database to be backed up/restored (BYO Amazon S3 account).

[jQuery](http://jquery.com/) is used throughout, for DOM manipulation & AJAX calls.

[QUnit](http://docs.jquery.com/Qunit) is used for unit testing.

[JSCoverage](http://siliconforks.com/jscoverage/) is used to measure unit test code coverage.

[jslint_on_rails](https://github.com/psionides/jslint_on_rails) is used to run JSLint over the entire code base.

Requirements
============
* WebKit-based browser, with HTML5 database support
* In development, Ruby/RubyGems/Bundler (recommend [RVM](http://beginrescueend.com/))
* In production/staging, somewhere to host the Ruby app and public HTML/JS/CSS files (recommend [Heroku](http://heroku.com) or similar)

Installation (Development)
==========================
1. Clone the repository (`git clone git://github.com/scottohara/tvmanager.git`)
2. Install the dependencies (`cd tvmanager && bundle install`)
3. Start the server (`rackup`, or I prefer [shotgun](http://rtomayko.github.com/shotgun) as it automatically reloads as you make changes)
2. Point your browser at /index.html
(Tip: On the iPhone, use the "Add to Home Screen" option to create a permanent icon that runs the app in fullscreen mode without the Safari chrome)

The first time it runs it will create the database (you should receive a message saying that the database has been upgraded, and to restart the app).

Deployment (Staging/Production)
===============================
If you use use heroku, it's a simple `git push heroku master`.

By default, the name of the client-side HTML5 database is "TVManager". Database names must be unique for the domain (origin), so in the event that you are hosting multiple environments under the same domain (eg. tvmanager.mydomain.com/production and tvmanager.mydomain.com/staging), you can override the default database name for one or both environments using an environment variable. For example, in development:

`export DATABASE_NAME='TVManagerDev'`

For staging/production, if you use Heroku:

`heroku config:add DATABASE_NAME=TVManagerStaging --remote staging`

The default database name doesn't need to be overriden if each environment is hosted under a separate domain (eg. tvmanager.mydomain.com and tvmanagerstaging.mydomain.com)

Offline Mode
============
HTML5 application caching uses a manifest file to indicate which files are allowed to be cached. If the manifest file changes (in any way), all cached resources are refreshed from the server.

To avoid having to manually keep the manifest file up to date with new/changed files, it is dynamically generated on the server using the [Manifesto gem](https://github.com/johntopley/manifesto).

You can test that the application cache is working by disconnecting from the network (or turning your mobile device to flight mode); and if everything goes well you should be able to continue using the app even though you're disconnected.

Import/Export
=============
The app includes a backup/restore facility. As log of all changes made to the local HTML5 database since the last export is kept, and when an export is initiated, those changes are serialized to a JSON-representation and sent to an Amazon S3 account configured on the server.

Restoring the database does the reverse, pulling all JSON objects from S3 (via the server), clearing any existing data from the database and reloading it from the JSON.

An MD5 checksum veries that the data was imported/exported succesfully.

To enable the Import/Export functionality, you will need to declare the following environment variables:

* AMAZON_ACCESS_KEY_ID={your AWS access credentials}
* AMAZON_SECRET_ACCESS_KEY={your AWS secret key}
* S3_ENDPOINT={optional, the S3 region to use. Defaults to s3.amazonaws.com if none specified}
* S3_BACKUP_BUCKET={the bucket to use for storing backup data. Will be created automatically if doesn't exist. See important note below.}

In development, the above environment variables can be saved to a file (eg. ~/.aws), which can then be sourced in your shell profile (eg. ~/.profile, ~/.bashrc, ~/.zshrc), eg.

**~/.aws**

```
export AMAZON_ACCESS_KEY_ID='your AWS access credentials'
export AMAZON_SECRET_ACCESS_KEY='your AWS secret key'
export S3_ENDPOINT='s3-ap-southeast-1.amazonaws.com'
export S3_BACKUP_BUCKET='devtvmanager.yourdomain.com'
```

**~/.profile**

```
AWS=~/.aws
if [ -f $AWS ]; then
	. $AWS
fi
```

For staging/production, if you use Heroku you can specify these config vars using the heroku CLI gem, eg.

```
heroku config:add AMAZON_ACCESS_KEY_ID=your_AWS_access_credentials AMAZON_SECRET_ACCESS_KEY=your_AWS_secret_key (etc..) S3_BACKUP_BUCKET=stagingtvmanager.yourdomain.com --remote staging
heroku config:add AMAZON_ACCESS_KEY_ID=your_AWS_access_credentials AMAZON_SECRET_ACCESS_KEY=your_AWS_secret_key (etc..) S3_BACKUP_BUCKET=tvmanager.yourdomain.com --remote production
```

(Assumes you have setup two Heroku remotes, one for staging and one for production)

Test Suite
==========
Before running the tests, ensure that the server is configured for testing (this prevents, for example, the unit tests for exporting/importing inadvertently overwriting your actual backups on S3 with test data, as test mode doesn't touch S3 at all).

To run the server in test mode:

* `rake test:client`

Alternatively, you can start the server manually using the -E argument (eg. `rackup -E test` or `shotgun -E test`). If you try running the unit tests when the server is not in test mode, you will be warned and prompted by your browser whether or not to continue.

To run the entire QUnit test suite, simply browse to [http://localhost:9393/test/index.html](http://localhost:9393/test/index.html)

To run a single QUnit test module, append '?module-name' (eg. [http://localhost:9393/test/index.html?application-controller](http://localhost:9393/test/index.html?application-controller))

Once the test suite is passing cleanly, to check the test suite coverage:

* install [JSCoverage](http://siliconforks.com/jscoverage/)
* run the test:coverage rake task (eg. `rake test:coverage`). This generates generates an instrumented copy of the code for tracking coverage.
* browse to [http://localhost:9292/jscoverage.html?test/index.html&missing=true](http://localhost:9292/jscoverage.html?test/index.html&missing=true) (Note: unlike the test:client task, which uses shotgun to start the server on a default port of 9393; the test:coverage task uses rackup on port 9292. For some reason, jscoverage wouldn't run properly using shotgun)
* on the Summary tab, check that we have >=99% total coverage

Coverage Exceptions:

* database-controller.js (96%): 2 lines that handle upgrading to an earlier version are not tested
* episodes-controller.js (98%): 1 line that sets the jQueryUI sortable helper offset is not tested
* database-mock.js (97%): 2 lines that handle malformed SQL commands (mismatched parameters & tokens) are not tested

To run lint:

* `rake jslint`

JSlint configuration options are set in config/jslint.yml
