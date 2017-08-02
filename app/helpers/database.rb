# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require 'couchrest'
require_relative '../models/error'

module TVManager
	module Helpers
		# Provides a database connection singleton for the application
		module Database
			def db
				@@db ||= CouchRest.database! database_url
			end

			private unless ENV['RACK_ENV'].eql? 'test'

			def database_url
				# Get the database URL environment variable
				url = ENV[:TVMANAGER_COUCHDB_URL.to_s]

				# Raise a 500 error if the environment variable is not set
				raise InternalServerError, 'TVMANAGER_COUCHDB_URL environment variable is not configured' if url.nil?

				# Suffix the URL with "_test" when in the :test configuration
				url += '_test' if ENV['RACK_ENV'].eql? 'test'

				# Return the URL
				url
			end

			def disconnect!
				@@db = nil
			end
		end
	end
end
