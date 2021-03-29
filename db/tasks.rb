# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require 'json'
require_relative '../app/helpers/database'

module TVManager
	# Provides database management operations
	class Database
		class << self
			include ::TVManager::Helpers::Database
			def recreate!
				# Abort if we're not in the test environment
				# :nocov:
				raise unless ::ENV['RACK_ENV'].eql? 'test'

				# :nocov:

				# Delete and recreate the database
				db.recreate!
			end

			def migrate!
				# Update each of the design documents in /db/design/*.json
				::Dir.glob(::File.join(__dir__, 'design', '*.json')).each do |filename|
					print "Updating #{::File.basename(filename)}..."

					# Read the file and parse the JSON
					doc = ::JSON.parse ::File.read(filename)

					# Get the existing doc (if any) and copy the _rev property to the new doc
					existing_doc = db.get doc['_id']
					# :nocov:
					doc['_rev'] = existing_doc['_rev'] unless existing_doc.nil?
					# :nocov:

					# Save the document
					db.save_doc doc

					puts 'done'
				end
			end

			# :nocov:
			def authorise_devices!
				# Authorise all existing devices
				db.view('devices/all', include_docs: true)['rows'].each do |doc|
					device = doc['doc']
					device['readOnly'] = false
					db.save_doc device
				end
			end

			def make_pending!(id)
				# Get the specified document
				pending_doc = db.get! id

				# Make the document pending for all existing devices
				db.view('devices/all', include_docs: true)['rows'].each do |doc|
					device = doc['doc']
					pending_doc['pending'] << device['_id']
				end

				# Save the document
				db.save_doc pending_doc
			end
			# :nocov:
		end
	end
end
