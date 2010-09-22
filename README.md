What is TV Manager?
=======================
TV Manager is a simple HTML5 webapp that keeps track of which episodes of your favourite TV shows you:

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

![Schedule](http://scotto74.github.com/tvmanager/schedule.png "Schedule")

![Program List](http://scotto74.github.com/tvmanager/program-list.png "Program List")

![Episode List](http://scotto74.github.com/tvmanager/episode-list.png "Episode List")

![Edit Episode](http://scotto74.github.com/tvmanager/episode-edit.png "Edit Episode")

Architecture
============
As mentioned above, the app is purely a HTML5 web application.

It was developed with the iPhone in mind, so the styling is very "iPhone-ish"; however it runs on any WebKit-based browsers (mobile or desktop) that support client-side storage (eg. runs great in Chrome on the desktop).

It uses the HTML5 application cache, so it continues to function when offline/disconnected.

The code uses an MVC-style architecture, with a custom "view stack" for navigating through the screens (ie. opening a view 'pushes' it onto the top of the stack; closing the view 'pops' it off the stack, revealing the previous view underneath).

Database schema changes are managed via an upgrade routine on startup (similar to Rails-style migrations).

[jQuery](http://jquery.com/) is used throughout, for DOM manipulation & AJAX calls.

[QUnit](http://docs.jquery.com/Qunit) is used for unit testing.

[JSCoverage](http://siliconforks.com/jscoverage/) is used to measure unit test code coverage.

[nodelint](http://github.com/tav/nodelint) is used to run JSLint over the entire code base.

Requirements
============
* WebKit-based browser, with HTML5 database support
* Somewhere to host the HTML/JS/CSS files  (any web server will do, however see the notes below regarding caching/importing/exporting)

Installation
============
1. Drop the contents of the src/ directory onto your server.
2. Point your browser at /index.html
(Tip: On the iPhone, use the "Add to Home Screen" option to create a permanent icon that runs the app in fullscreen mode without the Safari chrome)

The first time it runs it will create the database (you should receive a message saying that the database has been upgraded, and to restart the app).

Offline Mode
============
HTML5 application caching uses a manifest file to indicate which files are allowed to be cached.  If the manifest file changes (in any way), all cached resources are refreshed from the server.

To avoid having to manually keep the manifest file up to date with new/changed files, it is dynamically generated using some server-side script implemented in ASP. This means that (currently) you need to host the site on an IIS server if you want to use application caching.

You can test that the application cache is working by disconnecting from the network (or turning your mobile device to flight mode); and if everything goes well you should be able to continue using the app even though you're disconnected.

Import/Export
=============
The app includes a rudimentary backup/restore facility.  Backing up the database simply serializes all of the data to a JSON-respresentation, and saves it to the /export directory on the server.

The last 10 versions are retained on the server (as export.txt.0....export.txt.9).

Restoring the database does the reverse, pulling the latest JSON file (export.txt) from the server, clearing any existing data from the database and reloading it from the JSON.

An MD5 checksum veries that the data was imported/exported succesfully.

Again, just like the dynamically generated cache manifest above, the export & checksum server-side code is implemented in ASP, which requires the site to be hosted on an IIS server.