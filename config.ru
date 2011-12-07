#\ -s thin
require './app'

configure :testCoverage do
	set :environment, :test
	set :public_folder, Proc.new { File.join(root, 'testCoverage') }
end

run Sinatra::Application
