# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require 'rubygems'
require 'bundler/setup'
require_relative 'app/models/error'
require_relative 'db/migrate'

unless ENV[:RACK_ENV.to_s].eql? 'production'
	require 'rspec/core/rake_task'
	require 'open4'
	require 'platform-api'
	require 'git'
	require 'logger'
	RSpec::Core::RakeTask.new(:spec)
end

def start_server(browse = false, &block)
	Open4.popen4 "shotgun#{browse && ' --browse --host localhost --url /index.html'}", &block
end

def start_simulator(description, url)
	# Get the list of available simulator devices into an array
	devices = `xcrun instruments -s devices`.split "\n"
	selected_device = nil

	until selected_device
		# Present the list of options to the user
		puts
		devices.each_with_index { |device, index| puts "#{index + 1}) #{device}" }
		puts
		puts 'Enter the number of the simulator to launch: '

		# Get the selected simulator to launch
		selected_device = devices[STDIN.gets.chomp.to_i - 1]
		puts 'Invalid choice' if selected_device.nil?
	end

	# Launch the simulator, then pause for an arbitrary amount of time to allow the boot process to complete
	`xcrun instruments -w '#{selected_device}'`
	sleep 3

	# Load the passed URL into Mobile Safari
	sh "xcrun simctl openurl booted #{url}"
	puts "#{description} in simulator"

	# Monitor by looking for a Booted simulator; until one no longer exists.
	loop do
		sleep 5
		count = `xcrun simctl list | grep Booted | wc -l`.to_i
		break if count.eql? 0
	end

	puts 'Simulator closed'
end

namespace :db do
	desc 'Run database migrations (for CouchDB, this means updating the _design docs)'
	task :migrate do
		TVManager::Database.migrate!
	end
end

namespace :deploy do
	# Assumes two git remotes, named staging and production
	%i[staging production].each do |remote|
		desc "Deploy to #{remote}"
		task remote do
			logger = Logger.new STDOUT
			logger.level = Logger::WARN
			logger.formatter = proc { |_severity, _datetime, _progname, msg| "#{msg}\n" }

			# Get a reference to the git repo
			git = Git.open __dir__, log: logger

			# Get a reference to the named remote
			git_remote = git.remote remote

			# Extract the name of the application from the remote URL
			# (Assumes heroku, so the URL will be git@heroku.com:APP_NAME.git)
			app_name = git_remote.url.match(/^git@heroku\.com\:(.*)\.git$/)[1]

			# Get the most recent tag
			# (Would be great if ruby-git supported git describe, so that we don't need this system call)
			latest_version = `git describe --abbrev=0`.chomp

			# Connect to the heroku API
			heroku = PlatformAPI.connect_oauth ENV[:TVMANAGER_HEROKU_TOKEN.to_s]

			# Get the APP_VERSION config var for the application
			previous_version = heroku.config_var.info_for_app(app_name)['APP_VERSION']

			# Abort if the version being pushed is already deployed
			if latest_version.eql? previous_version
				puts "#{latest_version} is already deployed to #{remote}. Please create a new tag for the new version."
				next
			end

			print "Deploy #{latest_version} to #{remote} (#{app_name}), replacing #{previous_version}? (y)es or (n)o [enter = no]: "
			unless STDIN.gets.chomp.casecmp('y').zero?
				puts 'Deployment aborted'
				next
			end

			logger.level = Logger::DEBUG

			# Deploy the latest version to the specified remote
			git.push remote, "#{latest_version}^{}:master"

			# Update the APP_VERSION config var
			heroku.config_var.update app_name, 'APP_VERSION' => latest_version

			puts 'Deployment done'
		end
	end
end

namespace :simulator do
	desc 'Run the application in an iOS simulator'
	task :run do
		start_server do |server_pid|
			start_simulator 'Application launched', 'http://localhost:9393/index.html'
			puts 'Stopping server.'
			Process.kill 'SIGTERM', server_pid
		end
	end
end
