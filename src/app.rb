require 'sinatra'
require 'manifesto'

get '/' do
	redirect 'index.html'
end

get '/manifest' do
	headers 'Content-Type' => 'text/cache-manifest'
	Manifesto.cache :directory => settings.root + "/public"
end
