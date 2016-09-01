# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true
require 'json'
require_relative 'base_controller'
require_relative '../helpers/environment'

module TVManager
	# Provides the default route and config settings needed by the client
	class ApplicationController < BaseController
		helpers TVManager::Helpers::Environment

		# ======
		# ROUTES
		# ======

		# Default route, redirects to /public/index.html
		get '/' do
			redirect 'index.html'
		end

		# Route for database configuration settings
		get '/dbConfig' do
			content_type :json
			{databaseName: database_name}.to_json
		end

		# Route for database configuration settings
		get '/appConfig' do
			content_type :json
			{appVersion: app_version, maxDataAgeDays: max_data_age_days.to_i}.to_json
		end
	end
end
