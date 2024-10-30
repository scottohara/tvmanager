# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require 'rails_helper'

::RSpec.describe 'Series' do
	describe 'GET /programs/:id/series' do
		it 'should return a list of series for the program', :ok do
			program = create(:program)
			series = create_list(:series, 2, program:)
			get(program_series_index_path(program), headers:)
			expect(response.parsed_body.pluck 'id').to eq series.map(&:id)
		end

		it 'should return an empty array if there are no series for the program', :ok do
			program = create(:program)
			get(program_series_index_path(program), headers:)
			expect(response.parsed_body).to eq []
		end
	end

	describe 'GET /series/:id' do
		it 'should return a single series', :ok do
			series = create(:series)
			get(series_path(series), headers:)
			expect(response.parsed_body[:id]).to eq series.id
		end

		it 'should respond with a 404 Not Found status if the series is not found', :record_not_found do
			series = build(:series, id: 1)
			get(series_path(series), headers:)
		end
	end

	describe 'GET /series/count' do
		it 'should return a count of series', :ok do
			create_list(:series, 3)
			get(count_series_index_path, headers:)
			expect(response.parsed_body).to eq 3
		end

		it 'should return zero if there are no series', :ok do
			get(count_series_index_path, headers:)
			expect(response.parsed_body).to eq 0
		end
	end

	describe 'GET /scheduled' do
		it 'should return a list of scheduled series', :ok do
			series = create_list(:series, 2, :now_showing)
			get(scheduled_path, headers:)
			expect(response.parsed_body.pluck 'id').to eq series.map(&:id)
		end

		it 'should return an empty array if there are no scheduled series', :ok do
			get(scheduled_path, headers:)
			expect(response.parsed_body).to eq []
		end
	end

	describe 'POST /programs/:id/series' do
		it 'should create a new series for the program', :created do
			program = create(:program)
			series = attributes_for(:series, program_id: program.id)
			post(program_series_index_path(program), params: {series:}, headers:)
			expect(response.parsed_body[:name]).to eq series[:name]
		end

		it 'should respond with a 422 Unprocessable Entity status if the series is invalid', :record_invalid do
			program = create(:program)
			series = attributes_for(:series, name: nil, program_id: program.id)
			post(program_series_index_path(program), params: {series:}, headers:)
		end
	end

	describe 'PUT /series/:id' do
		it 'should update a series', :ok do
			series = create(:series)
			put(series_path(series), params: {series: series.attributes}, headers:)
			expect(response.parsed_body).to be true
		end

		it 'should respond with a 422 Unprocessable Entity status if the series is invalid', :record_invalid do
			series = create(:series)
			series.name = nil
			put(series_path(series), params: {series: series.attributes}, headers:)
		end

		it 'should respond with a 404 Not Found status if the series is not found', :record_not_found do
			series = build(:series, id: 1)
			put(series_path(series), params: {series: series.attributes}, headers:)
		end
	end

	describe 'DELETE /series/:id' do
		let(:accept_header) { nil }

		it 'should delete a series' do
			series = create(:series)
			delete(series_path(series), headers:)
			expect(response).to have_http_status :no_content
			expect(response.parsed_body).to be_empty
			get(series_path(series), headers:)
			expect(response).to have_http_status :not_found
		end

		it 'should respond with a 404 Not Found status if the series is not found', :record_not_found do
			series = build(:series, id: 1)
			delete(series_path(series), headers:)
		end
	end
end
