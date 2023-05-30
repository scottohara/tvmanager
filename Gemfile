# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

ruby '3.2.2'

source 'https://rubygems.org'

# Interface to CouchDb database
gem 'couchrest', '2.0.1'

# Web server
gem 'puma', '6.2.2'

# Task runner
gem 'rake', '13.0.6'

# Web application framework
gem 'sinatra', '3.0.6'

# Restarts app on file changes
gem 'rerun', '0.14.0', group: :development

group :development, :test do
	# Loads environment variables from .env
	gem 'dotenv', '2.8.1'

	# HTTP testing framework (provides methods like :post, :get, :delete etc.)
	gem 'rack-test', '2.1.0'

	# BDD testing framework
	gem 'rspec', '3.12.0'

	# Code style checker
	gem 'rubocop', '1.51.0', require: false

	# Rubocop Performance cops
	gem 'rubocop-performance', '1.18.0', require: false

	# Rubocop RSpec cops
	gem 'rubocop-rspec', '2.22.0', require: false

	# Rubocop Rake cops
	gem 'rubocop-rake', '0.6.0', require: false

	# Shared Rubocop config
	gem 'rubocop-config-oharagroup', '2.4.0', require: false

	# Code coverage
	gem 'simplecov', '0.22.0', require: false
end
