# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

ruby '3.0.2'

source 'https://rubygems.org'

# Interface to CouchDb database
gem 'couchrest', '2.0.1'

# JSON parsing
gem 'json', '2.6.1'

# Web server
gem 'puma', '5.5.2'

# Task runner
gem 'rake', '13.0.6'

# Web application framework
gem 'sinatra', '2.1.0'

# Restarts app on file changes
gem 'rerun', '0.13.1', group: :development

group :development, :test do
	# Loads environment variables from .env
	gem 'dotenv', '2.7.6'

	# HTTP testing framework (provides methods like :post, :get, :delete etc.)
	gem 'rack-test', '1.1.0'

	# BDD testing framework
	gem 'rspec', '3.10.0'

	# Code style checker
	gem 'rubocop', '1.22.3', require: false

	# Rubocop Performance cops
	gem 'rubocop-performance', '1.12.0'

	# Rubocop RSpec cops
	gem 'rubocop-rspec', '2.6.0'

	# Rubocop Rake cops
	gem 'rubocop-rake', '0.6.0'

	# Shared Rubocop config
	gem 'rubocop-config-oharagroup', '2.3.0', require: false

	# Code coverage
	gem 'simplecov', '0.21.2', require: false
end
