| Service        | Status                                                                                                                                                                                   |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub         | [![Build Status](https://github.com/scottohara/tvmanager/workflows/Build/badge.svg)](https://github.com/scottohara/tvmanager/actions?workflow=Build)                                     |
| Code Climate   | [![Code Climate](https://codeclimate.com/github/scottohara/tvmanager.png)](https://codeclimate.com/github/scottohara/tvmanager)                                                          |
| Code Climate   | [![Test Coverage](https://codeclimate.com/github/scottohara/tvmanager/badges/coverage.svg)](https://codeclimate.com/github/scottohara/tvmanager)                                         |
| Snyk (npm)     | [![Known Vulnerabilities](https://snyk.io/test/github/scottohara/tvmanager/badge.svg)](https://snyk.io/test/github/scottohara/tvmanager)                                                 |
| Snyk (Gemfile) | [![Known Vulnerabilities](https://snyk.io/test/github/scottohara/tvmanager/badge.svg?targetFile=Gemfile.lock)](https://snyk.io/test/github/scottohara/tvmanager?targetFile=Gemfile.lock) |

# What is TV Manager?

TV Manager is a Progressive Web App (PWA) that keeps track of which episodes of your favourite TV shows you:

- have seen,
- have recorded to your DVR (or downloaded by other means),
- expect to be broadcast in the near future, or
- missed

The data model is very simple:
**Programs consist of zero or more Series, which consist of zero or more Episodes.**

**Programs** simply have a name (eg. "Lost")

**Series** have a name (eg. "Series 1" or "Season 1") and optionally a broadcast frequency (eg. "Daily" or "Mondays" or "Tuesdays", etc.)

**Episodes** have a name, a status (eg. Watched/Recorded/Expected/Missed), a date (ie. _when_ the episode was recorded/expected/missed), plus some attributes to indicate whether it is unverified (eg. you _think_ this is the eposide you recorded, but you're not 100% sure) or unscheduled (don't forget to set your DVR!)

The main view is the **Schedule**, which lists all series that are currently airing (ie. have a frequency other than "Not Showing"), plus any other series that may not be currently airing but have one or more recorded or upcoming episodes expected.

The other main view is **Unscheduled**, which lists any upcoming episodes that flagged as "unscheduled". This is your TODO list for programming your DVR.

The rest of the app consists of data management views (add/edit/delete programs, series & episodes) and basic reports (eg. "All recorded", "All Expected", "All Missed" etc.).

# Screenshots

![Schedule](http://scottohara.github.io/tvmanager/schedule.png "Schedule")

![Program List](http://scottohara.github.io/tvmanager/program-list.png "Program List")

![Episode List](http://scottohara.github.io/tvmanager/episode-list.png "Episode List")

![Edit Episode](http://scottohara.github.io/tvmanager/episode-edit.png "Edit Episode")

# Architecture

The code is developed in an MVC-style architecture, with a custom "view stack" for navigating through the screens (ie. opening a view 'pushes' it onto the top of the stack; closing the view 'pops' it off the stack, revealing the previous view underneath).

# Requirements

- Browser with support for ECMAScript 2017, Service Workers & App Manifest
- For development: Node.JS/npm, Ruby/RubyGems/Bundler (recommend [asdf](http://asdf-vm.com/)) and a Postgress database
- For production/staging: somewhere to host the Ruby app and public HTML/JS/CSS files (recommend [Fly.io](http://fly.io) or similar) and a Postgres database

# Installation (Development)

1. Clone the repository (`git clone git://github.com/scottohara/tvmanager.git`)
2. Install the dependencies (`cd tvmanager && bundle config --local path vendor/bundle && bundle install && npm install`) (`path vendor/bundle` ensures that gems are installed locally in the project)
3. Start the server (`npm start`)

(Tip: On the iPhone, use the "Add to Home Screen" option to create a permanent icon that runs the app in fullscreen mode without the Safari chrome)

# Configuration

The app uses basic authentication, and you will need to declare the following environment variables (replacing the values with your own):

**.env**

```
TVMANAGER_USERNAME='username'
TVMANAGER_PASSWORD='supersecret'
```

For staging/production, if you use Fly.io you can specify these as secrets using the `flyctl` CLI, eg.

```
fly secrets set TVMANAGER_USERNAME=username --app <name staging or production app>
```

(Assumes you have setup two Fly apps, one for staging and one for production)

# Running Tests

Frontend specs are implemented using [mocha](https://mochajs.org/)+[chai](http://chaijs.com/)+[sinon](http://sinonjs.org/).

Four [karma](http://karma-runner.github.io/0.12/index.html) configurations are available to run the frontend test suite:

1. `npm run test:bdd` watches for any file changes and runs the full test suite (without code coverage)
2. `npm run test:coverage` performs a single full test suite run, including [instanbul](http://gotwarlost.github.io/istanbul/) (via [karma-coverage](https://github.com/karma-runner/karma-coverage)) code coverage reporting. Summary coverage report is written to stdout, and a detailed HTML report is available in `/tvmanager/coverage/frontend/index.html`
3. `npm run test:coverage:chrome` is the same as `npm run test:coverage`, except only for headless Chrome
4. `npm run test:coverage:mobile` is the same as `npm run test:coverage`, except only for iOS Simulator

By default, the `test:bdd` suite is run in Chrome, and the `test:coverage` suite is run in headless Chrome and iOS Simulator.

To run the tests in Mobile Safari on a physical device:

- start the test runner _without_ launching the default browsers (`npm run test:coverage -- --browsers`)
- the Karma server will pause waiting for a browser connection
- manually launch Mobile Safari and browse to the URL shown in the terminal window (eg. `http://localhost:9876`)

Backend specs are implemented using [RSpec](http://rspec.info/):

1. `npm run test:backend` starts the database server and runs the RSpec test suite
2. To run specific specs, use RSpec filtering (`fdescribe`, `fit`, `xdescribe`, `xit`)

Integration tests are implemented using [Cypress](http://cypress.io/):

1. `npm run test:e2e` starts the database server and launches Cypress
2. Optionally run Cypress in headless mode (`cypress run --browser chrome`)

# Code Quality

Frontend checks are implemented using [eslint](http://eslint.org):

- `npm run lint`

Backend checks are implemented using [rubocop](http://batsov.com/rubocop/):

- `bundle exec rubocop`

# Deployment (Staging/Production)

Before deploying, you should first create an annotated tag (e.g. `git tag -am "Version 1.00" v1.00`).

Then run:

- `npm run deploy:staging` to deploy to the staging app
- `npm run deploy:production` to deploy to the production app
