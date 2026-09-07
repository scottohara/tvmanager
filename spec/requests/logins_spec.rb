# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require 'rails_helper'

::RSpec.describe 'Logins' do
	describe 'POST /logins' do
		let(:accept_header) { 'text/plain' }

		before do
			post logins_path, headers:
		end

		context 'with valid credentials' do
			it 'should respond with a 201 Created status' do
				expect(response).to have_http_status :created
				expect(response.media_type).to eq accept_header
				expect(response.body).to eq ''
			end
		end

		context 'with invalid credentials' do
			after do
				expect(response).to have_http_status :unauthorized
				expect(response.media_type).to eq accept_header
				expect(response.body).to eq 'Invalid login and/or password'
			end

			context 'none' do
				let(:headers) { nil }

				it('should respond with a 401 Unauthorized status') {} # Empty block
			end

			context 'incorrect user name' do
				let(:headers) { {AUTHORIZATION: ::ActionController::HttpAuthentication::Basic.encode_credentials('invalid user name', password)} }

				it('should respond with a 401 Unauthorized status') {} # Empty block
			end

			context 'incorrect password' do
				let(:headers) { {AUTHORIZATION: ::ActionController::HttpAuthentication::Basic.encode_credentials(user_name, 'invalid password')} }

				it('should respond with a 401 Unauthorized status') {} # Empty block
			end

			context 'no colon separating the user name and password' do
				let(:headers) { {AUTHORIZATION: "Basic #{::Base64.strict_encode64 'user'}"} }

				it('should respond with a 401 Unauthorized status') {} # Empty block
			end

			context 'undecodable credentials' do
				let(:headers) { {AUTHORIZATION: 'Basic !!!'} }

				it('should respond with a 401 Unauthorized status') {} # Empty block
			end
		end

		context 'with misconfigured environment' do
			after do
				expect(response).to have_http_status :internal_server_error
				expect(response.media_type).to eq 'text/plain'
				expect(response.body).to include "#{variable} environment variable must be set"
			end

			context 'user name' do
				let(:variable) { 'TVMANAGER_USERNAME' }

				context 'unset' do
					let(:env_user_name) { nil }

					it('should respond with a 500 Internal Server Error status') {} # Empty block
				end

				context 'empty' do
					let(:env_user_name) { '' }

					it('should respond with a 500 Internal Server Error status') {} # Empty block
				end
			end

			context 'password' do
				let(:variable) { 'TVMANAGER_PASSWORD' }

				context 'unset' do
					let(:env_password) { nil }

					it('should respond with a 500 Internal Server Error status') {} # Empty block
				end

				context 'empty' do
					let(:env_password) { '' }

					it('should respond with a 500 Internal Server Error status') {} # Empty block
				end
			end
		end
	end
end
