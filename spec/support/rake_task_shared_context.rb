# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require 'rake'

# Shared context for rake task specs
::RSpec.shared_context 'Rake task' do
	# Use a fresh application for each example so that each has its own registry of tasks.
	# Restoring the original effectively clears any registered tasks just for that example.
	around do |example|
		rake_application = ::Rake.application
		::Rake.application = ::Rake::Application.new
		example.run
	ensure
		::Rake.application = rake_application
	end

	before do
		::Rake::Task.define_task :environment
		allow(::ActiveRecord::Base).to receive :establish_connection
	end
end

::RSpec.configure do |config|
	config.include_context 'Rake task', type: :task
end
