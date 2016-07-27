require 'json'
require_relative '../app/helpers/database'

module TVManager
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
					begin
						doc["_rev"] = db.get!(doc["_id"])["_rev"]
					rescue
					end

					# Save the document
					db.save_doc doc

					puts "done"
				end
			end
		end
	end
end
