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
			content_type 'application/json'
			::TVManager::Document.pending(@device_id).to_json
		end

		# Create/update document
		post '/' do
			request.body.rewind
			doc = ::JSON.parse request.body.read

			# Save the document
			::TVManager::Document.new(doc).save! @device_id
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
