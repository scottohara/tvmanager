# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

# Shared context for request specs
::RSpec.shared_context 'Request' do
	let(:user_name) { 'valid user name' }
	let(:password) { 'valid password' }
	let(:env_user_name) { user_name }
	let(:env_password) { password }
	let :headers do
		{
			ACCEPT: (defined?(accept_header) && accept_header) || 'application/json',
			AUTHORIZATION: ::ActionController::HttpAuthentication::Basic.encode_credentials(user_name, password)
		}
	end

	before do
		allow(::ENV).to receive(:[]).and_call_original
		allow(::ENV).to receive(:[]).with('TVMANAGER_USERNAME').and_return env_user_name
		allow(::ENV).to receive(:[]).with('TVMANAGER_PASSWORD').and_return env_password
	end

	# Standard responses
	after :each, :ok do
		expect(response).to have_http_status :ok
		expect(response.media_type).to eq 'application/json'
	end

	after :each, :created do
		expect(response).to have_http_status :created
		expect(response.media_type).to eq 'application/json'
	end

	after :each, :record_invalid do
		expect(response).to have_http_status :unprocessable_content
		expect(response.media_type).to eq 'text/plain'
		expect(response.body).to include "can't be blank"
	end

	after :each, :record_not_found do
		expect(response).to have_http_status :not_found
		expect(response.media_type).to eq 'text/plain'
		expect(response.body).to include "Couldn't find"
	end
end

::RSpec.configure do |config|
	config.include_context 'Request', type: :request
end
