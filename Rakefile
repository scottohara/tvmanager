# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require 'rubygems'
require 'bundler/setup'
require_relative 'app/models/error'
require_relative 'db/tasks'

unless ::ENV[:RACK_ENV.to_s].eql? 'production'
	require 'rspec/core/rake_task'
	::RSpec::Core::RakeTask.new(:spec)
end

namespace :db do
	desc 'Delete and recreate the test database (requires RACK_ENV=test)'
	task :recreate do
		::TVManager::Database.recreate!
	end

	desc 'Run database migrations (for CouchDB, this means updating the _design docs)'
	task :migrate do
		::TVManager::Database.migrate!
	end

	desc 'Authorise all registered devices to export (readonly = false)'
	task :authorise_devices do
		::TVManager::Database.authorise_devices!
	end

	desc 'Make the specified [:document_id] as pending for all registered devices (rake db:make_pending\'[document_id]\''
	task :make_pending, [:document_id] do |_t, args|
		abort 'You must provide a :document_id (eg. rake db:make_pending\'[123-456-789]\')' if args[:document_id].nil?

		::TVManager::Database.make_pending! args[:document_id]
	end
end
