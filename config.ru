#\ -s thin
require './app'

configure :testCoverage do
		print "Regenerating instrumented code..."

		source_dir = File.join(settings.root, 'public')
		dest_dir = File.join(settings.root, 'testCoverage')

		result = `jscoverage --no-instrument=framework --no-instrument=test/framework #{source_dir} #{dest_dir} 2>&1`
		abort result unless 0.eql? $?.to_i  

		puts "done!"

		set :environment, :test
		set :public_folder, Proc.new { dest_dir }
end

run Sinatra::Application
