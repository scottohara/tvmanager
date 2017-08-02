# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

module TVManager
	module Helpers
		# Helpers for environment variables
		module Environment
			# Returns the client database name (if specified)
			def database_name
				ENV[:DATABASE_NAME.to_s] || 'TVManager'
			end

			# Returns the current app version (if specified)
			def app_version
				ENV[:APP_VERSION.to_s] || `git describe`.chomp
			end

			# Returns the number of days since the last import/export before a warning notice is shown
			def max_data_age_days
				ENV[:TVMANAGER_MAX_DATA_AGE_DAYS.to_s] || 7
			end
		end
	end
end
