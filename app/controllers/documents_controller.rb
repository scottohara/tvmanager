# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require_relative '../models/device'
require_relative '../models/document'
require_relative 'base_controller'

module TVManager
	# Routes for importing to/exporting from the client
	class DocumentsController < BaseController
		# =======
		# FILTERS
		# =======

		# For all requests, a client device id must be specified
		before do
			@device_id = ::TVManager::Device.id request
		end

		# For any non-GET requests, check the device access
		before do
			::TVManager::Device.new(@device_id).check_access unless request.get?
		end

		# ======
		# ROUTES
		# ======

		# Get all documents
		get '/all' do
			content_type 'application/json'
			stream(&::TVManager::Document.all)
		end

		# Get pending documents (for the device)
		get '/pending' do
			docs = ::TVManager::Document.pending @device_id

			# Return a hash of the documents as the etag, and the documents themselves as the response body
			etag ::Digest::MD5.hexdigest docs.to_json

			content_type 'application/json'
			docs.to_json
		end

		# Create/update document
		post '/' do
			# Get the Content-MD5 header from the request
			md5_received = request.env['HTTP_CONTENT_MD5']

			# Create an MD5 digest of the request body
			doc = request.body.read
			md5_hex = ::Digest::MD5.hexdigest doc

			# Check that the MD5 received matches the MD5 generated
			raise ::TVManager::BadRequest, "Checksum mismatch on received change (#{md5_hex} != #{md5_received})" unless md5_received == md5_hex

			# Save the document
			::TVManager::Document.new(::JSON.parse doc).save! @device_id

			# Return the MD5 digest as the response etag
			etag md5_hex
		end

		# Delete document
		delete '/:id' do
			::TVManager::Document.new(params[:id]).delete! @device_id
		end

		# Remove pending device
		delete '/:id/pending' do
			::TVManager::Document.new(params[:id]).remove_pending! @device_id
		end
	end
end
