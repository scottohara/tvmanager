# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require_relative '../spec_helper'
require_relative '../../app/controllers/application_controller'

describe TVManager::ApplicationController do
	def app
		described_class
	end

	describe 'GET /' do
		it 'should redirect to index.html' do
			get '/'
			follow_redirect!
			expect(last_request.url).to eql 'http://example.org/index.html'
		end
	end
end
