require 'sinatra'
require 'manifesto'
require 'digest/md5'
require 'json'
require_relative 'error'
require_relative 'storagecontroller'

# Routing condition (true if :test configuration)
set(:isTest) do |env|
	condition do
		test?
	end
end

# Returns a storage controller instance
def db
	StorageController.new
end

# Returns the client database name (if specified)
def database_name
	ENV[:DATABASE_NAME.to_s] || "TVManager"
end

# Returns the client device ID
def device_id
	device_id = request.env["HTTP_X_DEVICE_ID"]
	raise BadRequest, "Client device identifer was not supplied" if device_id.nil?
	device_id
end

# Returns true if the specified device is authorised to make server changes
def is_read_only
	begin
		# Get the matching device document
		doc = db.get(device_id)

		# Return the readonly property
		doc["readOnly"]
	rescue RestClient::ResourceNotFound => e
		raise BadRequest, "Client device #{device_id} is not registered"
	end
end

# Returns all devices, except the specified device
def other_devices
	# Get all devices excluding the specified device
	devices = db.view("devices/all")["rows"].reject do |item|
		item["id"].eql? device_id
	end 

	# Return an array of device ids
	devices.map do |item|
		item["id"]
	end
end

# Removes the device from the pending list of a document
def remove_pending(doc, pending_device_id=nil)
	# If an explicit pending device was not specified, get it from the HTTP headers
	pending_device_id = device_id if pending_device_id.nil?

	# Remove the device from the pending array
	doc["pending"].reject! do |item|
		item.eql? pending_device_id
	end

	# Remove the pending array if empty
	doc.delete "pending" if doc["pending"].empty?

	# If the document is marked as deleted and has no pending array, delete the document; otherwise save the document
	if doc["isDeleted"] && !doc.has_key?("pending")
		db.get(doc['id']).destroy
	else
		db.save_doc doc
	end
end

# Default route, redirects to /public/index.html
get '/' do
	redirect 'index.html'
end

# Route for database configuration settings
get '/dbConfig' do
	content_type :json
	{ :databaseName => database_name }.to_json
end

# Route for HTML5 cache manifest
get '/manifest' do
	headers 'Content-Type' => 'text/cache-manifest'

	# Cache all files in the /public directory, except unit tests
	# Include any routes called via Ajax as network resources
	manifest_options = {
		:timestamp => false,
		:directory => settings.root + "/public",
		:excludes => [ settings.root + "/public/test" ],
		:network_includes => [ '/devices', '/export', '/import' ]
	}

	# In dev/test configuration, make unit tests network resources as well
	manifest_options[:network_includes] << '/test/*' if development? || test?

	# Generate the manifest
	manifest = Manifesto.cache manifest_options

	# Add a cache entry for dbConfig
	manifest.gsub! "\nNETWORK:", "/dbConfig\n# databaseName: #{database_name}\n\nNETWORK:"
end

# Route for checking whether the server is in :test configuration
head '/test' do
	begin
		raise Forbidden, "Server is not running in the test configuration" unless test?
		status 200
	rescue HttpError => e
		status e.class.status
		e.message
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
		raise Forbidden, "Client device #{device_id} is not authorised to export" if is_read_only

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

		# Set the other devices to notify of this change
		doc["pending"] = other_devices

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
		raise Forbidden, "Client device #{device_id} is not authorised to export" if is_read_only

		# Get the existing doc
		doc = db.get(params[:id])

		# If the document is already marked for deletion, remove the device from the pending array
		if doc["isDeleted"]
			remove_pending doc
		else
			# Mark it as deleted
			doc["isDeleted"] = true

			# Set the other devices to notify of this change
			doc["pending"] = other_devices

			# Save the document
			db.save_doc doc
		end
		
	# Ignore any errors where the doc we're deleting was not found
	rescue RestClient::ResourceNotFound => e
		status 200

	rescue HttpError => e
		status e.class.status
		e.message

	rescue StandardError => e
		status 500
		e.message
	end
end

['/import', '/import/:all'].each do |path|
	# Import route used for testing
	get path, :isTest => :environment do
		begin
			etag "test-hash"
			File.read(File.join("public", "test", "database.json"))
		end
	end

	# Import route
	get path do
		begin
			if params[:all]
				# Get all documents
				docs = []
				db.view "data/all", "include_docs" => true do |doc|
					docs << doc
				end
				raise NotFound, "No data" if docs.nil?
			else
				# Get all documents pending for this device
				docs = db.view "data/pending", "key" => device_id, "include_docs" => true
				docs = docs["rows"]
			end

			# Return a hash of the documents as the etag, and the documents themselves as the response body
			etag Digest::MD5.hexdigest docs.to_json
			docs.to_json

		rescue HttpError => e
			status e.class.status
			e.message

		rescue StandardError => e
			status 500
			e.message
		end
	end
end

# Delete pending route used for testing
delete '/import/:id', :isTest => :environment do
	begin
	end
end

# Delete pending route
delete '/import/:id' do
	begin
		# Get the existing doc
		doc = db.get(params[:id])

		# Remove the device from the pending array
		remove_pending doc

	rescue HttpError => e
		status e.class.status
		e.message

	rescue StandardError => e
		status 500
		e.message
	end
end

# Device registration route used for testing
put '/devices/:name', :isTest => :environment do
	begin
		# Echo back the name that was passed
		headers "Location" => params[:name]
	end
end

# Device registration route
put '/devices/:name' do
	begin
		# Check if a client device identifier was provided
		device_id = request.env["HTTP_X_DEVICE_ID"]

		device = unless (device_id.nil? || device_id.empty?)
			# Get the existing device document
			db.get(device_id)
		else
			# Create a new device document
			{
				:type => "device",
				:readOnly => true
			}
		end
		
		# Set the device name
		device[:name] = params[:name]

		# Save the document
		db.save_doc device

		# Return the _id in the response location header
		headers "Location" => device["_id"]
		return
	
	rescue RestClient::ResourceNotFound => e
		raise NotFound, "Client device #{params[:name]} is not registered"

	rescue HttpError => e
		status e.class.status
		e.message

	rescue StandardError => e
		status 500
		e.message
	end
end

# Deregistration route used for testing
delete '/devices/:id', :isTest => :environment do
	begin
	end
end

# Deregistration route
delete '/devices/:id' do
	begin 
		# Get all documents pending for this device
		docs = db.view("data/pending", "key" => params[:id], "include_docs" => true)["rows"].each do |row|
			# Remove the device from the pending array
			remove_pending row['doc'], params[:id]
		end

		# Delete the device
		db.get(params[:id]).destroy

	# Ignore any errors where the doc we're deleting was not found
	rescue RestClient::ResourceNotFound => e
		status 200

	rescue HttpError => e
		status e.class.status
		e.message

	rescue StandardError => e
		status 500
		e.message
	end
end

