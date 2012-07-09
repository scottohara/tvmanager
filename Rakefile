require 'json'
require_relative 'error'
require_relative 'storagecontroller'

unless ENV[:RACK_ENV.to_s].eql?("production")
	require 'jslint/tasks'
	require 'open4'
	JSLint.config_path = "config/jslint.yml"
end

def start_test_server(&block)
	Open4::popen4 "shotgun -E test -O -u /test/index.html", &block
end
	
def start_testcoverage_server(root_dir, source_dir, &block)
	puts "Regenerating instrumented code..."

	dest_dir = File.join(root_dir, 'testCoverage')

	result = sh "jscoverage --no-instrument=framework --no-instrument=test/framework #{source_dir} #{dest_dir}"
	abort result unless 0.eql? $?.to_i  

	puts "done!"

	#Open4::popen4 "shotgun -E testCoverage -O -u /jscoverage.html?test/index.html&missing=true"
	Open4::popen4 "rackup -E testCoverage", &block
end

namespace :test do
	root_dir = File.dirname(__FILE__)
	source_dir = File.join(root_dir, 'public')

	desc "Start the server in :test mode for manually running the Qunit test suite"
	task :client do
		start_test_server do |pid, stdin, stdout|
			puts "Server started on port 9393. Browse to http://localhost:9393/test/index.html to run Qunit test suite. Ctrl-C to quit."
			puts stdout.read
		end
	end

	desc "Start the server in :testCoverage mode for manually running the JSCoverage statistics"
	task :coverage do
		start_testcoverage_server(root_dir, source_dir) do |pid, stdin, stdout|
			puts "Server started on port 9292. Browse to http://localhost:9292/jscoverage.html?test/index.html&missing=true to run JSCoverage statistics. Ctrl-C to quit."
			puts stdout.read
		end
	end

	desc "Run JSLint, the Qunit test suite and the JSCoverage statistics (headless)"
	task :headless => [:jslint, "headless:client", "headless:coverage"]

	namespace :headless do
		desc "Start the server in :test mode, and run the Qunit test suite (headless)"
		task :client do
			start_test_server do |server_pid|
				Open4::popen4 "http_proxy= && phantomjs #{source_dir}/test/run-qunit.js http://localhost:9393/test/index.html" do |pid, stdin, stdout, stderr|
					puts stdout.read
				end
				Process.kill "SIGTERM", server_pid
			end
		end

		desc "Start the server in :testCoverage mode, and run the JSCoverage statistics (headless)"
		task :coverage do
			start_testcoverage_server(root_dir, source_dir) do |server_pid|
				sleep 1
				Open4::popen4 "http_proxy= && phantomjs #{source_dir}/test/run-jscoverage.js http://localhost:9292/jscoverage.html?test/index.html" do |pid, stdin, stdout, stderr|
					puts stdout.read
				end
				Process.kill "SIGTERM", server_pid
			end
		end
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
		Dir.glob(File.join(File.dirname(__FILE__), 'db', 'design', '*.json')).each do |filename|
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
