# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

ruby file: '.tool-versions'

source 'https://rubygems.org'

# Interface to CouchDb database
gem 'couchrest', '2.0.1'

# Web server
gem 'puma', '6.4.3'

# Task runner
gem 'rake', '13.2.1'

# Web application framework
gem 'sinatra', '4.0.0'

# Restarts app on file changes
gem 'rerun', '0.14.0', group: :development

group :development, :test do
	# Loads environment variables from .env

	# HTTP testing framework (provides methods like :post, :get, :delete etc.)
	gem 'rack-test', '2.1.0'

	# BDD testing framework
	gem 'rspec', '3.13.0'

	# Code style checker
	gem 'rubocop', '1.67.0', require: false

	# Rubocop Performance cops
	gem 'rubocop-performance', '1.22.1', require: false

	# Rubocop RSpec cops
	gem 'rubocop-rspec', '3.1.0', require: false

	# Rubocop Rake cops
	gem 'rubocop-rake', '0.6.0', require: false

	# Shared Rubocop config
	gem 'rubocop-config-oharagroup', '2.5.0', require: false

	# Code coverage
	gem 'simplecov', '0.22.0', require: false
end
