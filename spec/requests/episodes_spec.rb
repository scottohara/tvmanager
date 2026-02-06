# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require 'rails_helper'

::RSpec.describe 'Episodes' do
	describe 'GET /series/:id/episodes' do
		it 'should return a list of episodes for the series', :ok do
			series = create(:series)
			episodes = create_list(:episode, 2, series:)
			get(series_episodes_path(series), headers:)
			expect(response.parsed_body.pluck 'id').to eq episodes.map(&:id)
		end

		it 'should return an empty array if there are no episodes for the series', :ok do
			series = create(:series)
			get(series_episodes_path(series), headers:)
			expect(response.parsed_body).to eq []
		end
	end

	describe 'GET /episodes/:id' do
		it 'should return a single episode', :ok do
			episode = create(:episode)
			get(episode_path(episode), headers:)
			expect(response.parsed_body[:id]).to eq episode.id
		end

		it 'should respond with a 404 Not Found status if the episode is not found', :record_not_found do
			episode = build(:episode, id: 1)
			get(episode_path(episode), headers:)
		end
	end

	describe 'GET /episodes/count' do
		it 'should return a count of episodes', :ok do
			create_list(:episode, 3)
			get(count_episodes_path, headers:)
			expect(response.parsed_body).to eq 3
		end

		it 'should return zero if there are no episodes', :ok do
			get(count_episodes_path, headers:)
			expect(response.parsed_body).to eq 0
		end
	end

	describe 'GET /episodes/:status/count' do
		it 'should return a count of episodes for the status', :ok do
			create_list(:episode, 3, :watched)
			get(count_status_episodes_path(:watched), headers:)
			expect(response.parsed_body).to eq 3
		end

		it 'should return zero if there are no episodes for the status', :ok do
			get(count_status_episodes_path(:watched), headers:)
			expect(response.parsed_body).to eq 0
		end
	end

	describe 'GET /unscheduled' do
		it 'should return a list of unscheduled episodes', :ok do
			episodes = create_list(:episode, 2, :unscheduled)
			get(unscheduled_path, headers:)
			expect(response.parsed_body.pluck 'id').to eq episodes.map(&:id)
		end

		it 'should return an empty array if there are no unscheduled episodes', :ok do
			get(unscheduled_path, headers:)
			expect(response.parsed_body).to eq []
		end
	end

	describe 'POST /series/:id/episodes' do
		it 'should create a new episode for the series', :created do
			series = create(:series)
			episode = attributes_for(:episode, sequence: 1, series_id: series.id)
			post(series_episodes_path(series), params: {episode:}, headers:)
			expect(response.parsed_body[:name]).to eq episode[:name]
		end

		it 'should respond with a 422 Unprocessable Content status if the episode is invalid', :record_invalid do
			series = create(:series)
			episode = attributes_for(:episode, name: nil, sequence: 1, series_id: series.id)
			post(series_episodes_path(series), params: {episode:}, headers:)
		end
	end

	describe 'PUT /episodes/:id' do
		it 'should update a episode', :ok do
			episode = create(:episode)
			put(episode_path(episode), params: {episode: episode.attributes}, headers:)
			expect(response.parsed_body).to be true
		end

		it 'should respond with a 422 Unprocessable Content status if the episode is invalid', :record_invalid do
			episode = create(:episode)
			episode.name = nil
			put(episode_path(episode), params: {episode: episode.attributes}, headers:)
		end

		it 'should respond with a 404 Not Found status if the episode is not found', :record_not_found do
			episode = build(:episode, id: 1)
			put(episode_path(episode), params: {episode: episode.attributes}, headers:)
		end
	end

	describe 'DELETE /episodes/:id' do
		let(:accept_header) { nil }

		it 'should delete a episode' do
			episode = create(:episode)
			delete(episode_path(episode), headers:)
			expect(response).to have_http_status :no_content
			expect(response.parsed_body).to be_empty
			get(episode_path(episode), headers:)
			expect(response).to have_http_status :not_found
		end

		it 'should respond with a 404 Not Found status if the episode is not found', :record_not_found do
			episode = build(:episode, id: 1)
			delete(episode_path(episode), headers:)
		end
	end
end
