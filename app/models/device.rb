require_relative '../helpers/database'
require_relative '../models/document'
require_relative 'error'

module TVManager
	class Device
		include TVManager::Helpers::Database

		attr_reader :id

		class << self
			include TVManager::Helpers::Database

			# Returns the client device id from the request
			def id(request)
				device_id = request.env["HTTP_X_DEVICE_ID"]
				raise BadRequest, "Client device identifier was not supplied" if device_id.nil? or device_id.empty?
				device_id
			end

			# Returns all device ids except the current device
			def other_devices(device_id)
				db.view("devices/all")["rows"]
					.reject{|device| device["id"].eql? device_id}
					.map{|device| device["id"]}
			end
		end

		def initialize(device_id)
			@id = device_id

			# If a device id was not provided, initialise a new device document
			@device = {type: "device", readOnly: true} if device_id.nil?
		end

		def check_access
			raise Forbidden, "Client device #{@id} is not authorised to export" if document["readOnly"]
		end

		# Set the device name
		def name=(name)
			document["name"] = name
		end

		# Saves the device
		def save!
			save_result = db.save_doc document

			# Update the state of the current instance and return the id
			document["_rev"] = save_result["rev"]
			@id = document["_id"] = save_result["id"]
		end

		# Deletes the device
		def delete!
			# Remove the device from all pending documents
			db.view("data/pending", "key" => @id)["rows"].each{|doc| Document.new(doc["id"]).remove_pending! @id}

			# Delete the device
			document.destroy
		end

		private unless ENV["RACK_ENV"].eql? "test"

		def document
			begin
				#Find the matching device document
				@device ||= db.get! @id
			rescue CouchRest::NotFound
				raise BadRequest, "Client device #{@id} is not registered"
			end
		end
	end
end
