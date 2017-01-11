# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require 'manifesto'
require_relative 'base_controller'
require_relative '../helpers/environment'

module TVManager
	# Provides the appcache manifest for offline support
	class ManifestController < BaseController
		helpers TVManager::Helpers::Environment

		# ==========
		# CONDITIONS
		# ==========

		# Routing condition (true if the app cache is disabled)
		set :noAppCache do |_|
			condition do
				ENV[:TVMANAGER_NO_APPCACHE.to_s].eql? 'true'
			end
		end

		# =============
		# CONFIGURATION
		# =============

		# Register cache manifest mime type
		configure do
			mime_type :cache_manifest, 'text/cache-manifest'
		end

		# ======
		# ROUTES
		# ======

		# Route for HTML5 cache manifest when app cache is disabled
		get '/', noAppCache: true do
			content_type :cache_manifest

			# Cache nothing, using an open online whitelist wildcard flag
			"CACHE MANIFEST\nNETWORK:\n*"
		end

		# Route for HTML5 cache manifest when app cache is enabled
		get '/' do
			content_type :cache_manifest

			# Cache all files in the /public directory, except unit tests
			# Include any routes called via Ajax as network resources
			manifest_options = {
				timestamp: false,
				directory: settings.public_folder,
				network_includes: %w[/devices /documents]
			}

			# Generate the manifest
			manifest = Manifesto.cache manifest_options

			# Add cache entries for dbConfig & appConfig
			config_entries = <<~CACHE
				/dbConfig
				/appConfig
				# databaseName: #{database_name}
				# appVersion: #{app_version}
			CACHE
			manifest.gsub! "\nNETWORK:", "#{config_entries}\nNETWORK:"
		end
	end
end
