# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true
require 'json'
require_relative '../app/helpers/database'

module TVManager
	# Provides database management operations
	class Database
		class << self
			include TVManager::Helpers::Database

			def migrate!
				# Update each of the design documents in /db/design/*.json
				Dir.glob(File.join(__dir__, 'design', '*.json')).each do |filename|
					print "Updating #{File.basename(filename)}..."

					# Read the file and parse the JSON
					doc = JSON.parse File.read(filename)

					# Get the existing doc (if any) and copy the _rev property to the new doc
					existing_doc = db.get doc['_id']
					doc['_rev'] = existing_doc['_rev'] unless existing_doc.nil?

					# Save the document
					db.save_doc doc

					puts 'done'
				end
			end
		end
	end
end
