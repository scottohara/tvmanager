# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

# Application controller
class ApplicationController < ::ActionController::API
	before_action :authenticate_user, except: [:routing_error]
	rescue_from ::StandardError, with: :internal_error
	rescue_from ::ActiveRecord::RecordInvalid, with: :record_invalid
	rescue_from ::ActiveRecord::RecordNotFound, with: :record_not_found
	include ::ActionController::HttpAuthentication::Basic::ControllerMethods

	def routing_error
		render json: "Path #{params[:unmatched_route]} is not valid", status: :not_found
	end

	private

	def authenticate_user
		render plain: 'Invalid login and/or password', status: :unauthorized unless authenticate_with_http_basic do |username, password|
			::ActiveSupport::SecurityUtils.secure_compare(username, required_env_variable('TVMANAGER_USERNAME')) & ::ActiveSupport::SecurityUtils.secure_compare(password, required_env_variable('TVMANAGER_PASSWORD'))
		end
	end

	def required_env_variable(variable)
		value = ::ENV[variable]
		raise ::KeyError, "#{variable} environment variable must be set" if value.blank?

		value
	end

	def internal_error(exception)
		render json: exception.message, status: :internal_server_error
	end

	def record_invalid(exception)
		render json: exception.record.errors.full_messages.join(', '), status: :unprocessable_content
	end

	def record_not_found(exception)
		render json: exception.message, status: :not_found
	end
end
