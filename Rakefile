require 'rubygems'
require 'bundler/setup'
require 'json'
require_relative 'error'
require_relative 'storagecontroller'

unless ENV[:RACK_ENV.to_s].eql?("production")
	require 'jslint/tasks'
	require 'jshint/tasks'
	require 'open4'
	require 'heroku-api'
	require 'git'
	require 'logger'
	JSLint.config_path = "config/jslint.yml"
	JSHint.config_path = "config/jshint.yml"
end

def start_server(&block)
	Open4::popen4 "shotgun -O -u /index.html", &block
end
	
def start_test_runner(&block)
	Open4::popen4 "karma start --browsers", &block
end

def start_simulator(description, url)
	# Get the list of available simulator devices into an array
	devices = `xcrun instruments -s devices | grep Simulator`.split "\n"

	# Present the list of options to the user
	devices.each_with_index {|device, index| puts "#{index + 1}) #{device}"}
	puts
	puts "Enter the number of the simulator to launch: "

	# Get the selected simulator to launch
	device = devices[STDIN.gets.chomp.to_i - 1]
	raise "Invalid choice" if device.nil?

	# Launch the simulator, then pause for an arbitrary amount of time to allow the boot process to complete
	`xcrun instruments -w '#{device}'`
	sleep 3

	# Load the passed URL into Mobile Safari
	sh "xcrun simctl openurl booted #{url}"
	puts "#{description} in simulator"

	# Find the pid of the running simulator process (if more than one, assume last one)
	pid = `pgrep "iOS Simulator"`.split("\n").last.to_i

	# Monitor the pid by sending kill 0 to it every second; until it no longer exists.
	begin
		while Process.kill 0, pid do
			sleep 1
		end
	rescue
		puts "Simulator closed"
	end
end

namespace :db do
	desc "Start the development database"
	task :start do
		sh "couchdb"
	end

	desc "Run database migrations (for CouchDB, this means updating the _design docs)"
	task :migrate do
		# Initialise the storage controller
		db = StorageController.new

		# Update each of the design documents in /db/design/*.json
		Dir.glob(File.join(__dir__, 'db', 'design', '*.json')).each do |filename|
			print "Updating #{File.basename(filename)}..."

			# Read the file and parse the JSON
			doc = JSON.parse File.read(filename)

			# Get the existing doc (if any) and copy the _rev property to the new doc
			begin
				doc["_rev"] = db.get(doc["_id"])["_rev"]
			rescue
			end

			# Save the document
			db.save_doc doc

			puts "done"
		end
	end
end

namespace :docs do
	desc "Generates JSDoc3 documentation"
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
	[:staging, :production].each do |remote|
		desc "Deploy to #{remote}"
		task remote do
			logger = Logger.new(STDOUT)
			logger.level = Logger::WARN
			logger.formatter = proc do |severity, datetime, progname, msg|
				"#{msg}\n"
			end

			# Get a reference to the git repo
			git = Git.open __dir__, :log => logger

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
			previous_version = heroku.get_config_vars(app_name).body["APP_VERSION"]

			# Abort if the version being pushed is already deployed
			raise "#{latest_version} is already deployed to #{remote}. Please create a new tag for the new version." if latest_version.eql? previous_version
			
			print "Deploy #{latest_version} to #{remote} (#{app_name}), replacing #{previous_version}? (y)es or (n)o [enter = no]: "
			raise "Deployment aborted" unless STDIN.gets.chomp.downcase.eql? 'y'

			logger.level = Logger::DEBUG

			# Deploy the latest version to the specified remote
			git.push remote, "#{latest_version}^{}:master"
			
			# Update the APP_VERSION config var
			heroku.put_config_vars app_name, "APP_VERSION" => latest_version

			puts "Deployment done"
		end
	end
end

namespace :simulator do
	desc "Run the application in an iOS simulator"
	task :run do
		start_server do |server_pid|
			start_simulator "Application launched", "http://localhost:9393/index.html"
			puts "Stopping server."
			Process.kill "SIGTERM", server_pid
		end
	end

	desc "Run the test suite in an iOS simulator"
	task :test do
		start_test_runner do |server_pid, stdin, stdout|
			start_simulator "Test suite started", "http://localhost:9876"
			puts "Stopping test runner."
			puts stdout.read
			Process.kill "SIGTERM", server_pid
		end
	end
end

namespace :appcache do
	desc "Starts the server with the HTML5 application cache enabled"
	task :enable do
		ENV.delete :TVMANAGER_NO_APPCACHE.to_s
		start_server do |pid, stdin, stdout|
			puts "Server started on port 9393. Browse to http://localhost:9393/index.html to run the application. Ctrl-C to quit."
			puts stdout.read
		end
	end

	desc "Starts the server with the HTML5 application cache disabled"
	task :disable do
		ENV[:TVMANAGER_NO_APPCACHE.to_s] = "true"
		start_server do |pid, stdin, stdout|
			puts "Server started on port 9393. Browse to http://localhost:9393/index.html to run the application. Ctrl-C to quit."
			puts stdout.read
		end
	end
end
