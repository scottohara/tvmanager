# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

ruby '2.3.1'

source 'https://rubygems.org'

group :development do
	gem 'foreman'
	gem 'shotgun'
	gem 'open4'
	gem 'rake'
	gem 'heroku-api'
	gem 'git'
	gem 'rubocop', require: false
end

gem 'thin'
gem 'sinatra'
gem 'manifesto'
gem 'couchrest'
gem 'json'

group :development, :test do
	gem 'rspec'
	gem 'rack-test'
	gem 'simplecov'
end

# Code Climate test coverage
gem 'codeclimate-test-reporter', group: :test, require: nil
