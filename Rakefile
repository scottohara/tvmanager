require 'jslint/tasks'
JSLint.config_path = "config/jslint.yml"

namespace :test do
	desc "Start the server in :test mode, and run the Qunit test suite"
	task :client do
		sh "shotgun -E test -O -u /test/index.html"
	end

	desc "Start the server in :testCoverage mode, and run the JSCoverage statistics"
	task :coverage do
		puts "Regenerating instrumented code..."

		root_dir = File.dirname(__FILE__)
		source_dir = File.join(root_dir, 'public')
		dest_dir = File.join(root_dir, 'testCoverage')

		result = sh "jscoverage --no-instrument=framework --no-instrument=test/framework #{source_dir} #{dest_dir}"
		abort result unless 0.eql? $?.to_i  

		puts "done!"

		#sh "shotgun -E testCoverage -O -u /jscoverage.html?test/index.html&missing=true"
		sh "rackup -E testCoverage"
	end
end
