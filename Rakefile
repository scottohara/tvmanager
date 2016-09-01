# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true
require 'rubygems'
require 'bundler/setup'
require_relative 'app/models/error'
require_relative 'db/migrate'

unless ENV[:RACK_ENV.to_s].eql? 'production'
	require 'rspec/core/rake_task'
	require 'jslint/tasks'
	require 'jshint/tasks'
	require 'open4'
	require 'heroku-api'
	require 'git'
	require 'logger'
	JSLint.config_path = 'config/jslint.yml'
	JSHint.config_path = 'config/jshint.yml'
	RSpec::Core::RakeTask.new(:spec)
end

def start_server(&block)
	Open4.popen4 'shotgun -O -u /index.html', &block
end

def start_test_runner(&block)
	Open4.popen4 'karma start --browsers', &block
end

def start_simulator(description, url)
	# Get the list of available simulator devices into an array
	devices = `xcrun instruments -s devices`.split '\n'
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

	# Find the pid of the running simulator process (if more than one, assume last one)
	pid = `pgrep "iOS Simulator"`.split('\n').last.to_i

	# Monitor the pid by sending kill 0 to it every second; until it no longer exists.
	begin
		sleep 1 while Process.kill 0, pid
	rescue
		puts 'Simulator closed'
	end
end

namespace :db do
	desc 'Start the development database'
	task :start do
		sh 'couchdb'
	end

	desc 'Run database migrations (for CouchDB, this means updating the _design docs)'
	task :migrate do
		TVManager::Database.migrate!
	end
end

namespace :docs do
	desc 'Generates JSDoc3 documentation'
	task :generate do
		root_dir = __dir__
		source_dir = File.join(root_dir, 'public')
		config_path = File.join(root_dir, 'config', 'jsdoc3.json')
		dest_dir = File.join(root_dir, 'docs')
		sh "jsdoc #{source_dir} --recurse --private --configure #{config_path} --destination #{dest_dir}"
	end
end

namespace :deploy do
	# Assumes two git remotes, named staging and production
	%i(staging production).each do |remote|
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
			# (Assumes that ENV['HEROKU_API_KEY'] is defined)
			heroku = Heroku::API.new

			# Get the APP_VERSION config var for the application
			previous_version = heroku.get_config_vars(app_name).body['APP_VERSION']

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
			heroku.put_config_vars app_name, 'APP_VERSION' => latest_version

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

	desc 'Run the test suite in an iOS simulator'
	task :test do
		start_test_runner do |server_pid, _stdin, stdout|
			start_simulator 'Test suite started', 'http://localhost:9876'
			puts 'Stopping test runner.'
			puts stdout.read
			Process.kill 'SIGTERM', server_pid
		end
	end
end

namespace :appcache do
	desc 'Starts the server with the HTML5 application cache enabled'
	task :enable do
		ENV.delete :TVMANAGER_NO_APPCACHE.to_s
		start_server do |_pid, _stdin, stdout|
			puts 'Server started on port 9393. Browse to http://localhost:9393/index.html to run the application. Ctrl-C to quit.'
			puts stdout.read
		end
	end

	desc 'Starts the server with the HTML5 application cache disabled'
	task :disable do
		ENV[:TVMANAGER_NO_APPCACHE.to_s] = 'true'
		start_server do |_pid, _stdin, stdout|
			puts 'Server started on port 9393. Browse to http://localhost:9393/index.html to run the application. Ctrl-C to quit.'
			puts stdout.read
		end
	end
end
