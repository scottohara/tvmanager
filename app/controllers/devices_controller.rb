# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require_relative 'base_controller'
require_relative '../models/device'

module TVManager
	# Routes for registering/unregistering client devices
	class DevicesController < BaseController
		# ======
		# ROUTES
		# ======

		# Register device
		put '/:name' do
			device_id = Device.id request, false
			device = Device.new device_id
			device.check_access unless device_id.nil?
			device.name = params[:name]

			# Save the device and return the id in the response location header
			headers 'Location' => device.save!
			status 200
		end

		# Unregister device
		delete '/:id' do
			device_id = Device.id request
			device = Device.new device_id
			device.check_access
			raise Forbidden, 'Client device can only unregister itself' unless device_id.eql? params[:id]
			device.delete!
		end
	end
end
