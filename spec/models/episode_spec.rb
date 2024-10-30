# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require 'rails_helper'

::RSpec.describe ::Episode do
	it 'should be invalid without a name' do
		expect(build :episode, name: nil).not_to be_valid
	end

	it 'should be invalid without a sequence' do
		episode = build(:episode)
		episode.sequence = nil
		expect(episode).not_to be_valid
	end

	it 'should be invalid if sequence is not an integer' do
		episode = build(:episode)
		episode.sequence = 1.1
		expect(episode).not_to be_valid
	end

	it 'should be invalid without a series' do
		expect(build :episode, series: nil).not_to be_valid
	end

	it 'should be invalid without unverified' do
		expect(build :episode, unverified: nil).not_to be_valid
	end

	it 'should be invalid without unscheduled' do
		expect(build :episode, unscheduled: nil).not_to be_valid
	end

	describe '::list' do
		it 'should return the list of episodes for a given series' do
			series = create(:series)
			first_episode = create(:episode, :expected, :unverified, :unscheduled, name: 'Episode 1', series:)
			second_episode = create(:episode, name: 'Episode 2', series:)

			list = described_class.list series.id

			expect(list.first).to have_attributes id: first_episode.id, name: first_episode.name, status: 'expected', status_date: be_a(::Date), unverified: true, unscheduled: true, sequence: 1, series_id: series.id, series_name: series.name, program_name: series.program.name
			expect(list.second).to have_attributes id: second_episode.id, name: second_episode.name, status: nil, status_date: nil, unverified: false, unscheduled: false, sequence: 2, series_id: series.id, series_name: series.name, program_name: series.program.name
		end

		it 'should not include episodes for a different series' do
			this_series = create(:series, episodes: 1)
			other_series = create(:series, episodes: 1)

			list = described_class.list this_series.id

			expect(list).to include this_series.episodes.first
			expect(list).not_to include other_series.episodes.first
		end

		it 'should return the list of episodes sorted by sequence, then by id' do
			series = create(:series)
			third_episode = create(:episode, name: 'Episode 3', seq: 3, series:)
			first_episode = create(:episode, name: 'Episode 1', seq: 1, series:)
			fourth_episode = create(:episode, name: 'Episode 4', seq: 4, series:)
			second_episode = create(:episode, name: 'Episode 2', seq: 2, series:)

			expect(described_class.list(series.id).map { [_1.sequence, _1.id] }).to eq [
				[1, first_episode.id],
				[2, second_episode.id],
				[3, third_episode.id],
				[4, fourth_episode.id]
			]
		end
	end

	describe '::unscheduled' do
		it 'should return the list of episodes that are unscheduled' do
			first_episode = create(:episode, :missed, :unscheduled)
			second_episode = create(:episode, :expected, :unscheduled)

			list = described_class.unscheduled

			expect(list.first).to have_attributes id: first_episode.id, name: first_episode.name, status: 'missed', status_date: be_a(::Date), unverified: false, unscheduled: true, sequence: 1, series_id: first_episode.series.id, series_name: first_episode.series.name, program_name: first_episode.series.program.name
			expect(list.second).to have_attributes id: second_episode.id, name: second_episode.name, status: 'expected', status_date: be_a(::Date), unverified: false, unscheduled: true, sequence: 1, series_id: second_episode.series.id, series_name: second_episode.series.name, program_name: second_episode.series.program.name
		end

		it 'should not episodes that are not unscheduled' do
			unscheduled = create(:episode, :unscheduled)
			not_unscheduled = create(:episode)

			list = described_class.unscheduled

			expect(list).to include unscheduled
			expect(list).not_to include not_unscheduled
		end

		it 'should return the list of episodes sorted by status date' do
			create(:episode, :unscheduled, status_date: ::Date.parse('2024-01-03'))
			create(:episode, :unscheduled, status_date: ::Date.parse('2024-01-01'))
			create(:episode, :unscheduled, status_date: ::Date.parse('2024-01-04'))
			create(:episode, :unscheduled, status_date: ::Date.parse('2024-01-02'))

			expect(described_class.unscheduled.map(&:status_date)).to eq [
				::Date.parse('2024-01-01'),
				::Date.parse('2024-01-02'),
				::Date.parse('2024-01-03'),
				::Date.parse('2024-01-04')
			]
		end
	end
end
