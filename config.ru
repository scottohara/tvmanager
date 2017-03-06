#\ -s thin
# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true
require_relative 'app/controllers/application_controller'
require_relative 'app/controllers/manifest_controller'
require_relative 'app/controllers/documents_controller'
require_relative 'app/controllers/devices_controller'

map '/manifest' do
	run TVManager::ManifestController
end

map '/documents' do
	run TVManager::DocumentsController
end

map '/devices' do
	run TVManager::DevicesController
end

map '/' do
	run TVManager::ApplicationController
end
