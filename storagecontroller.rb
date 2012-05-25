require 'couchrest'

class StorageController
	def self.new
		# Check that we have all of the required environment variables
		[:TVMANAGER_COUCHDB_URL].each do |key|
			raise InternalServerError, key.to_s + " environment variable is not configured" unless ENV.key? key.to_s
		end

		# Connect to couch using the URL configured for the environment
		db = CouchRest.database! ENV[:TVMANAGER_COUCHDB_URL.to_s]

		# Return the db connection
		db
	end
end
