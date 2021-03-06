# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

ruby '3.0.1'

source 'https://rubygems.org'

# Interface to CouchDb database
gem 'couchrest'

# JSON parsing
gem 'json'

# Web server
gem 'puma'

# Task runner
gem 'rake'

# Web application framework
gem 'sinatra'

# Restarts app on file changes
gem 'rerun', group: :development

group :development, :test do
	# Loads environment variables from .env
	gem 'dotenv'

	# HTTP testing framework (provides methods like :post, :get, :delete etc.)
	gem 'rack-test'

	# BDD testing framework
	gem 'rspec'

	# Code style checker
	gem 'rubocop', require: false

	# Rubocop Performance cops
	gem 'rubocop-performance'

	# Rubocop RSpec cops
	gem 'rubocop-rspec'

	# Rubocop Rake cops
	gem 'rubocop-rake'

	# Shared Rubocop config
	gem 'rubocop-config-oharagroup', require: false

	# Code coverage
	gem 'simplecov', require: false
end
