# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require_relative '../helpers/database'
require_relative '../models/device'
require_relative 'error'

module TVManager
	# Represents a data document
	class Document
		include TVManager::Helpers::Database

		class << self
			include TVManager::Helpers::Database

			def all
				proc do |out|
					docs = []

					# Send the first part of the JSON
					out << '{"data":['

					first = true

					# Get all documents, and stream each one to the response
					db.view 'data/all', include_docs: true do |doc|
						out << ',' unless first
						out << doc.to_json
						docs << doc
						first = false
						doc
					end

					# Finalise the JSON with the MD5 checksum
					out << "],\"checksum\":\"#{Digest::MD5.hexdigest docs.to_json}\"}"
				end
			end

			def pending(device_id)
				# Get all documents pending for this device
				db.view('data/pending', key: device_id, include_docs: true)['rows']
			end
		end

		def initialize(document_or_id)
			if document_or_id.is_a? Hash
				# Parameter is a JSON document
				@id = document_or_id['id']
				document_or_id['_id'] = @id
				document_or_id['_rev'] = document['_rev'] unless document.nil?
				@document = document_or_id
			else
				# Parameter is an id
				@id = document_or_id
			end
		end

		# Saves the document
		def save!(device_id = nil)
			# Set the other devices to notify of this change
			document['pending'] = Device.other_devices device_id unless device_id.nil?

			# Save the document
			save_result = db.save_doc document

			# Update the state of the current instance and return the id
			document['_rev'] = save_result['rev']
			@id = document['_id'] = save_result['id']
		end

		# Deletes the document
		def delete!(device_id)
			return if document.nil?

			if Device.other_devices(device_id).empty?
				# No other devices to notify, so document can be deleted
				document.destroy
			else
				# Mark the document as deleted and notify all other devices
				document['isDeleted'] = true
				save! device_id
			end
		end

		# Remove a pending device
		def remove_pending!(device_id)
			return if document.nil?

			# Remove the devices from the pending array
			document['pending'].reject! { |device| device.eql? device_id }

			# If there are no other pending devices and the document is marked as deleted,
			# delete the document; otherwise save
			document['pending'].empty? && document['isDeleted'] ? document.destroy : save!
		end

		# :nocov:
		private unless ENV['RACK_ENV'].eql? 'test'
		# :nocov:

		def document
			# Find the matching document
			@document ||= db.get @id
		end
	end
end
