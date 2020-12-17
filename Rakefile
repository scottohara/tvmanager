# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require 'rubygems'
require 'bundler/setup'
require_relative 'app/models/error'
require_relative 'db/migrate'

unless ::ENV[:RACK_ENV.to_s].eql? 'production'
	require 'rspec/core/rake_task'
	::RSpec::Core::RakeTask.new(:spec)
end

namespace :db do
	desc 'Run database migrations (for CouchDB, this means updating the _design docs)'
	task :migrate do
		::TVManager::Database.migrate!
	end
end
