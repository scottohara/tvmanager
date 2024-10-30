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
		end
	end
end
