class HttpError < RuntimeError
	class << self
		attr_reader :status
	end
end	

class BadRequest < HttpError
	@status = 400
end

class Forbidden < HttpError
	@status = 403
end

class NotFound < HttpError
	@status = 404
end

class Conflict < HttpError
	@status = 409
end

class InternalServerError < HttpError
	@status = 500
end

