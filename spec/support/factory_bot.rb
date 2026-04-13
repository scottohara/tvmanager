# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

::RSpec.configure do |config|
	# FactoryBot configuration
	config.include ::FactoryBot::Syntax::Methods

	# Lint all factories
	config.before :suite do
		::DatabaseCleaner.clean_with :truncation
		::FactoryBot.lint
		::DatabaseCleaner.clean_with :truncation
	end
end
