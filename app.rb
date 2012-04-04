require 'sinatra'
require 'manifesto'
require 'couchrest'
require 'digest/md5'
require 'json'

# Routing condition (true if :test configuration)
set(:isTest) do |env|
	condition do
		test?
	end
end

# Returns the client database name (if specified)
def databaseName
	ENV[:DATABASE_NAME.to_s] || "TVManager"
end

# Default route, redirects to /public/index.html
get '/' do
	redirect 'index.html'
end

# Route for database configuration settings
get '/dbConfig' do
	content_type :json
	{ :databaseName => databaseName }.to_json
end

# Route for HTML5 cache manifest
get '/manifest' do
	headers 'Content-Type' => 'text/cache-manifest'
	manifest = Manifesto.cache :directory => settings.root + "/public"

	# In dev/test configuration, remove all references to /public/test/*
	# (this would be a good enhancment to the Manifesto gem, to support an :exclusions option....maybe someday)
	if development? || test?
		test = Manifesto.cache :directory => settings.root + "/public/test"

		# Drop the first three lines, and prefix the rest with '/test'
		test = test.to_a.drop(3).map do |line|
			"/test" + line
		end

		# Subtract any entries in test from manifest
		manifest = (manifest.to_a - test.to_a).join
	end

	# Add a cache entry for dbConfig
	manifest << "/dbConfig\n"
	manifest << "# databaseName: #{databaseName}\n"

	# Need to explicitly list any routes called via Ajax as network resources
	manifest << "\nNETWORK:\n"
	manifest << "/export\n"
	manifest << "/import\n"

	# In dev/test configuration, add everything in /public/test/* to the online whitelist
	# (not necessary for production/staging, as /public/test is excluded via .slugignore)
	manifest << "test/*\n" if development? || test?

	manifest
end

# Route for checking whether the server is in :test configuration
head '/test' do
	begin
		raise Forbidden, "Server is not running in the test configuration" unless test?
		status 200
	rescue HttpError => e
		status e.class.status
	end
end

# Create/update route used for testing
post '/export', :isTest => :environment do
	begin
		# Echo back the MD5 hash that was passed
		etag request.env["HTTP_CONTENT_MD5"]
	end
end

# Create/update object route
post '/export' do
	begin
		# Get the Content-MD5 header from the request
		md5_received = request.env["HTTP_CONTENT_MD5"]

		# Create an MD5 digest of the request body
		md5_hex = Digest::MD5.hexdigest request.body.read
		request.body.rewind

		# Check that the MD5 received matches the MD5 generated
		raise BadRequest, "Checksum mismatch on received change (#{md5_hex} != #{md5_received})" unless md5_received == md5_hex

		# Parse the JSON
		doc = JSON.parse request.body.read

		# Set the CouchDb _id to match the object's id
		doc["_id"] = doc["id"]

		# Initialise the storage controller
		db = StorageController.new

		# Get the existing doc (if any) and copy the _rev property to the new doc
		begin
			doc["_rev"] = db.get(doc["id"])["_rev"]
		rescue
		end

		# Save the document
		db.save_doc doc

		# Return the MD5 digest as the response etag
		etag md5_hex

	rescue HttpError => e
		status e.class.status
		e.message

	rescue StandardError => e
		status 500
		e.message
	end
end

# Delete route used for testing
delete '/export/:id', :isTest => :environment do
	begin
	end
end

# Delete object route
delete '/export/:id' do
	begin 
		# Initialise the storage controller
		db = StorageController.new

		# Delete the existing doc
		db.get(params[:id]).destroy

	rescue HttpError => e
		status e.class.status
		e.message

	rescue StandardError => e
		status 500
		e.message
	end
end

# Import route used for testing
get '/import', :isTest => :environment do
	begin
		etag "test-hash"
		File.read(File.join("public", "test", "database.json"))
	end
end

# Import route
get '/import' do
	begin
		# Initialise the storage controller
		db = StorageController.new

		# Get all documents
		docs = db.all_docs "include_docs" => true
		raise NotFound, "No data" if docs.nil?

		# Return a hash of the documents as the etag, and the documents themselves as the response body
		etag Digest::MD5.hexdigest docs["rows"].to_json
		docs["rows"].to_json

	rescue HttpError => e
		status e.class.status
		e.message

	rescue StandardError => e
		status 500
		e.message
	end
end

class HttpError < RuntimeError
	class << self
		attr_reader :status
	end
end	

class BadRequest < HttpError
	@status = 400
end

class Forbidden < HttpError
	@status = 403
end

class NotFound < HttpError
	@status = 404
end

class InternalServerError < HttpError
	@status = 500
end

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
