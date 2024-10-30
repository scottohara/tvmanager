# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require 'rails_helper'

::RSpec.describe 'Application' do
	describe 'GET /internal/error' do
		before do
			klass =
				::Class.new(::ApplicationController) do
					def index = raise ::StandardError, 'internal error'
				end

			stub_const 'TestController', klass

			::Rails.application.routes.draw do
				get '/internal/error', to: 'test#index'
			end
		end

		after do
			::Rails.application.reload_routes!
		end

		it 'should respond with a 500 Internal Server Error status' do
			get('/internal/error', headers:)
			expect(response).to have_http_status :internal_server_error
			expect(response.media_type).to eq 'application/json'
			expect(response.body).to eq 'internal error'
		end
	end

	describe 'GET /unmatched/route' do
		it 'should respond with a 404 Not Found status' do
			get('/unmatched/route', headers:)
			expect(response).to have_http_status :not_found
			expect(response.media_type).to eq 'application/json'
			expect(response.body).to eq 'Path unmatched/route is not valid'
		end
	end
end
