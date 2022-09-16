# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require_relative 'base_controller'

module TVManager
	# Provides the default route and config settings needed by the client
	class ApplicationController < BaseController
		# ======
		# ROUTES
		# ======

		# Default route, redirects to /public/index.html
		get '/' do
			redirect 'index.html'
		end
	end
end
