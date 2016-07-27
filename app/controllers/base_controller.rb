require 'sinatra/base'
require_relative '../models/error'

module TVManager
	class BaseController < Sinatra::Base
		enable :logging
		set :show_exceptions, :after_handler
		set :public_folder, "#{root}/../../public"

		# ======
		# ERRORS
		# ======

		# Error Handling
		error HttpError do
			err = env['sinatra.error']
			[err.class.status, err.message]
		end
	end
end
