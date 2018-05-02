# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require 'rubygems'
require 'bundler/setup'
require_relative 'app/models/error'
require_relative 'db/migrate'

unless ENV[:RACK_ENV.to_s].eql? 'production'
	require 'rspec/core/rake_task'
	require 'open4'
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
