require 'sinatra'
require 'manifesto'
require 'aws-sdk'
require 'digest/md5'

get '/' do
	redirect 'index.html'
end

get '/manifest' do
	headers 'Content-Type' => 'text/cache-manifest'
	manifest = Manifesto.cache :directory => settings.root + "/public"

	# Need to explicitly list any routes called via Ajax as network resources
	manifest << "\nNETWORK:\n"
	manifest << "export\n"
	manifest << "import\n"
	manifest
end

post '/export' do
	begin
		# Get the Content-MD5 header from the request
		md5_received = request.env["HTTP_CONTENT_MD5"]

		# Create an MD5 digest of the request body
		md5_hex = Digest::MD5.hexdigest request.body.read
		request.body.rewind

		# Check that the MD5 received matches the MD5 generated
		raise BadRequest, "Checksum mismatch on received backup" unless md5_received == md5_hex

		# Initialise the storage controller
		backup_bucket = StorageController.new

		# Create a base64 MD5 digest, to include with the request
		md5_base64 = Digest::MD5.base64digest request.body.read
		request.body.rewind

		# Post request body to the object name configured for the environment
		backup_object = AWS::S3::S3Object.new backup_bucket, ENV[:S3_BACKUP_OBJECT.to_s]
		backup_objectversion = backup_object.write :data => request.body.read, :content_length => request.content_length.to_i, :content_type => 'application/json', :content_md5 => md5_base64

		# Double check that the etag returned still matches the MD5 digest
		raise InternalServerError, "Checksum mismatch on stored backup (" + backup_objectversion.etag.gsub(/\"/, '') + " != " + md5_hex + ")" unless backup_objectversion.etag.gsub(/\"/, '') == md5_hex

		# Return the MD5 digest as the response etag
		etag md5_hex

	rescue HttpError => e
		status e.class.status
		e.message

	rescue StandardError => e
		status 500
		e.message
	end
end

get '/import' do
	begin
		# Initialise the storage controller
		backup_bucket = StorageController.new

		# Get the backup object
		backup_object = backup_bucket.objects[ENV[:S3_BACKUP_OBJECT.to_s]]
		raise NotFound, "Unable to located stored backup" if backup_object.nil?

		# Return the object's etag and data
		etag backup_object.etag.gsub(/\"/, '')
		backup_object.read

	rescue HttpError => e
		status e.class.status
		e.message

	rescue StandardError => e
		status 500
		e.message
	end
end

class HttpError < RuntimeError
	class << self
		attr_reader :status
	end
end	

class BadRequest < HttpError
	@status = 400
end

class NotFound < HttpError
	@status = 404
end

class InternalServerError < HttpError
	@status = 500
end

class StorageController
	def self.new
		# Check that we have all of the required environment variables
		[:AMAZON_ACCESS_KEY_ID, :AMAZON_SECRET_ACCESS_KEY, :S3_BACKUP_BUCKET, :S3_BACKUP_OBJECT].each do |key|
			raise InternalServerError, key.to_s + " environment variable is not configured" unless ENV.key? key.to_s
		end

		# Connect to S3 using the credentials (and optional endpoint) configured for the environment
		s3_config = {
			:access_key_id			=> ENV[:AMAZON_ACCESS_KEY_ID.to_s],
			:secret_access_key	=> ENV[:AMAZON_SECRET_ACCESS_KEY.to_s],
		}
		s3_config[:s3_endpoint] = ENV[:S3_ENDPOINT.to_s] if ENV.key? :S3_ENDPOINT.to_s
		s3 = AWS::S3.new s3_config

		# Get a reference to the backup bucket (create if not exists)
		backup_bucket = s3.buckets[ENV[:S3_BACKUP_BUCKET.to_s]]
		backup_bucket = s3.buckets.create ENV[:S3_BACKUP_BUCKET.to_s] unless backup_bucket.exists?

		# Make sure that versioning is enabled on the backup bucket
		backup_bucket.enable_versioning unless backup_bucket.versioned?

		# Return the backup bucket
		backup_bucket
	end
end
