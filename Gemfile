# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

ruby '2.4.1'

source 'https://rubygems.org'

group :development do
	gem 'foreman'
	gem 'git'
	gem 'heroku-api'
	gem 'open4'
	gem 'rake'
	gem 'rubocop', require: false
	gem 'shotgun'
end

gem 'couchrest'
gem 'json'
gem 'manifesto'
gem 'sinatra'
gem 'thin'

group :development, :test do
	gem 'rack-test'
	gem 'rspec'
	gem 'simplecov'
end

# Code Climate test coverage
gem 'codeclimate-test-reporter', group: :test, require: nil
