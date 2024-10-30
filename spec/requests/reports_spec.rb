# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require 'rails_helper'

::RSpec.describe 'Reports' do
	describe 'GET /reports/incomplete' do
		it 'should return a list of incomplete series', :ok do
			series = create_list(:series, 2, episodes: 1, watched: 1)
			get(incomplete_reports_path, headers:)
			expect(response.parsed_body.pluck 'id').to eq series.map(&:id)
		end

		it 'should return an empty array if there are no incomplete series', :ok do
			get(incomplete_reports_path, headers:)
			expect(response.parsed_body).to eq []
		end
	end

	describe 'GET /reports/:status' do
		it 'should return a list of series with episodes in the status', :ok do
			series = create_list(:series, 2, watched: 1)
			get(status_reports_path(:watched), headers:)
			expect(response.parsed_body.pluck 'id').to eq series.map(&:id)
		end

		it 'should return an empty array if there are no series with episodes in the status', :ok do
			get(status_reports_path(:watched), headers:)
			expect(response.parsed_body).to eq []
		end
	end
end
