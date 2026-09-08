# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require 'json'
require 'net/http'

# Seed TVManager database
module TVManager
	@logger = ::Logger.new $stdout
	@logger.formatter = proc { |_severity, _datetime, _progname, msg| "#{msg}\n" }

	@documents = nil

	@programs = {}
	@series = {}

	class << self
		def progress(action, count, type)
			@logger.info "\r#{action} #{count} #{type.pluralize count}"
		end

		def fetch_documents
			couchdb_url = ::ENV['COUCHDB_URL']
			couchdb_username = ::ENV['COUCHDB_USERNAME']
			couchdb_password = ::ENV['COUCHDB_PASSWORD']

			abort 'COUCHDB_URL, COUCHDB_USERNAME and COUCHDB_PASSWORD environment variables must be set' if couchdb_url.nil? || couchdb_username.nil? || couchdb_password.nil?

			fetch_url = URI "#{couchdb_url}/_design/data/_view/all?include_docs=true"

			http = ::Net::HTTP.new fetch_url.host, fetch_url.port
			http.use_ssl = fetch_url.scheme.eql? 'https'
			http.open_timeout = 5
			http.read_timeout = 30
			request = ::Net::HTTP::Get.new fetch_url
			request.basic_auth couchdb_username, couchdb_password

			@logger.info 'Fetching documents from CouchDb...'

			begin
				response = http.request request

				abort "Failed to fetch data: #{response.code} #{response.message}" unless response.code.eql? '200'

				result = ::JSON.parse response.body
			rescue ::SocketError, ::Errno::ECONNREFUSED, ::Errno::ECONNRESET, ::Net::OpenTimeout, ::Net::ReadTimeout, ::JSON::ParserError => e
				abort "Failed to fetch data: #{e.class}: #{e.message}"
			end

			@documents = result['rows'].pluck 'doc'
			@logger.info "Fetched #{@documents.size} documents from CouchDb"
		end

		def confirm!
			@logger.warn "WARNING: You are about to DELETE ALL DATA and reimport #{@documents.size} documents from the CouchDb database at #{::ENV['COUCHDB_URL']}. Type 'seed' and hit enter to proceed:"
			abort 'Seed aborted' if $stdin.gets.to_s.chomp.casecmp('seed').nonzero?
		end

		def delete_existing_data
			@logger.info 'Deleting existing data...'
			::Episode.delete_all
			::Series.delete_all
			::Program.delete_all
			@logger.info 'done'
		end

		def load_programs
			programs = @documents.filter { it['type'].eql? 'Program' }
			programs.each_with_index do |program, index|
				@programs[program['id']] = ::Program.create! name: program['programName']
				progress 'Loaded', index, 'program' if (index % 10).zero?
			end
			progress 'Loaded', programs.size, 'program'
		end

		def load_series
			series_list = @documents.filter { it['type'].eql? 'Series' }
			series_list.each_with_index do |series, index|
				@series[series['id']] = ::Series.create! name: series['seriesName'],
					now_showing: series['nowShowing'],
					program: @programs[series['programId']]
				progress 'Loaded', index, 'series' if (index % 10).zero?
			end
			progress 'Loaded', series_list.size, 'series'
		end

		def load_episodes
			episodes = @documents.filter { it['type'].eql? 'Episode' }
			episodes.each_with_index do |episode, index|
				::Episode.create! name: episode['episodeName'],
					status: episode['status'].presence&.downcase,
					status_date: begin
						::Date.parse episode['statusDate']
					rescue ::Date::Error, ::TypeError
						nil
					end,
					unverified: episode['unverified'],
					unscheduled: episode['unscheduled'],
					sequence: episode['sequence'],
					series: @series[episode['seriesId']]
				progress 'Loaded', index, 'episode' if (index % 10).zero?
			end
			progress 'Loaded', episodes.size, 'episode'
		end
	end
end

::TVManager.fetch_documents
::TVManager.confirm!
::TVManager.delete_existing_data
::TVManager.load_programs
::TVManager.load_series
::TVManager.load_episodes
