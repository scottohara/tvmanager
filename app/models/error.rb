# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

module TVManager
	# Common ancestor for all HTTP errors
	class HttpError < RuntimeError
		class << self
			attr_reader :status
		end
	end

	# 400 Bad Request
	class BadRequest < HttpError
		@status = 400
	end

	# 403 Forbidden
	class Forbidden < HttpError
		@status = 403
	end

	# 404 Not Found
	class NotFound < HttpError
		@status = 404
	end

	# 409 Conflict
	class Conflict < HttpError
		@status = 409
	end

	# 500 Internal Server Error
	class InternalServerError < HttpError
		@status = 500
	end
end
