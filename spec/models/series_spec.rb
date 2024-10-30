# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require 'rails_helper'

::RSpec.describe ::Series do
	it 'should be invalid without a name' do
		expect(build :series, name: nil).not_to be_valid
	end

	it 'should be invalid without a program' do
		expect(build :series, program: nil).not_to be_valid
	end

	it 'should be invalid if now showing is not an integer' do
		expect(build :series, now_showing: 1.1).not_to be_valid
	end

	it 'should be invalid if now showing is less than one' do
		expect(build :series, now_showing: 0).not_to be_valid
	end

	it 'should be invalid if now showing is greater than eight' do
		expect(build :series, now_showing: 9).not_to be_valid
	end

	describe '::list' do
		it 'should return the list of series for a given program and their count of episodes by status' do
			program = create(:program)
			first_series = create(:series, name: 'Series 1', episodes: 1, watched: 2, recorded: 3, expected: 4, missed: 5, program:)
			second_series = create(:series, :now_showing, name: 'Series 2', program:)

			list = described_class.list program.id

			expect(list.first).to have_attributes id: first_series.id, name: first_series.name, now_showing: nil, program_id: program.id, program_name: program.name, episode_count: 15, watched_count: 2, recorded_count: 3, expected_count: 4
			expect(list.second).to have_attributes id: second_series.id, name: second_series.name, now_showing: 1, program_id: program.id, program_name: program.name, episode_count: 0, watched_count: 0, recorded_count: 0, expected_count: 0
		end

		it 'should not include series for a different program' do
			this_program = create(:program, series: 1)
			other_program = create(:program, series: 1)

			list = described_class.list this_program.id

			expect(list).to include this_program.series.first
			expect(list).not_to include other_program.series.first
		end

		it 'should return the list of series sorted by name' do
			program = create(:program)
			create(:series, name: 'Series 3', program:)
			create(:series, name: 'Series 1', program:)
			create(:series, name: 'Series 4', program:)
			create(:series, name: 'Series 2', program:)

			expect(described_class.list(program.id).map(&:name)).to eq ['Series 1', 'Series 2', 'Series 3', 'Series 4']
		end
	end

	describe '::scheduled' do
		it 'should return the list of series that are now showing, or have at least one recorded or expected episode, and their count of episodes by status' do
			program = create(:program)
			first_series = create(:series, name: 'Series 1', now_showing: 1, episodes: 1, watched: 1, program:)
			second_series = create(:series, name: 'Series 2', now_showing: 8, program:)
			third_series = create(:series, name: 'Series 3', recorded: 1, program:)
			fourth_series = create(:series, name: 'Series 4', expected: 1, program:)
			fifth_series = create(:series, name: 'Series 5', expected_overdue: 1, program:)

			list = described_class.scheduled

			expect(list.first).to have_attributes id: first_series.id, name: first_series.name, now_showing: 1, program_id: program.id, program_name: program.name, episode_count: 2, watched_count: 1, recorded_count: 0, expected_count: 0, status_warning_count: 0
			expect(list.second).to have_attributes id: second_series.id, name: second_series.name, now_showing: 8, program_id: program.id, program_name: program.name, episode_count: 0, watched_count: 0, recorded_count: 0, expected_count: 0, status_warning_count: 0
			expect(list.third).to have_attributes id: third_series.id, name: third_series.name, now_showing: nil, program_id: program.id, program_name: program.name, episode_count: 1, watched_count: 0, recorded_count: 1, expected_count: 0, status_warning_count: 0
			expect(list.fourth).to have_attributes id: fourth_series.id, name: fourth_series.name, now_showing: nil, program_id: program.id, program_name: program.name, episode_count: 1, watched_count: 0, recorded_count: 0, expected_count: 1, status_warning_count: 0
			expect(list.fifth).to have_attributes id: fifth_series.id, name: fifth_series.name, now_showing: nil, program_id: program.id, program_name: program.name, episode_count: 1, watched_count: 0, recorded_count: 0, expected_count: 1, status_warning_count: 1
		end

		it 'should not include series that are not showing or do not have any recorded or expected episodes' do
			now_showing_series = create(:series, :now_showing)
			recorded_series = create(:series, recorded: 1)
			expected_series = create(:series, expected: 1)
			other_series = create(:series)

			list = described_class.scheduled

			expect(list).to include now_showing_series
			expect(list).to include recorded_series
			expect(list).to include expected_series
			expect(list).not_to include other_series
		end

		it 'should return the list of series sorted by now showing, then program name, then series name' do
			program_four = create(:program, name: 'Program 4')
			program_one = create(:program, name: 'Program 1')
			program_three = create(:program, name: 'Program 3')
			program_two = create(:program, name: 'Program 2')
			create(:series, name: 'Series 4', program: program_four, recorded: 1)
			create(:series, name: 'Series 6', program: program_one, now_showing: 8)
			create(:series, name: 'Series 3', program: program_two, now_showing: 1)
			create(:series, name: 'Series 5', program: program_three, recorded: 1)
			create(:series, name: 'Series 2', program: program_one, now_showing: 8)
			create(:series, name: 'Series 1', program: program_three, expected: 1)

			expect(described_class.scheduled.map { [_1.now_showing, _1.program_name, _1.name] }).to eq [
				[1, 'Program 2', 'Series 3'],
				[8, 'Program 1', 'Series 2'],
				[8, 'Program 1', 'Series 6'],
				[nil, 'Program 3', 'Series 1'],
				[nil, 'Program 3', 'Series 5'],
				[nil, 'Program 4', 'Series 4']
			]
		end
	end

	describe '::incomplete' do
		it 'should return the list of incomplete series and their count of episodes by status' do
			program = create(:program)
			first_series = create(:series, name: 'Series 1', episodes: 1, watched: 2, recorded: 3, expected: 4, missed: 5, program:)
			second_series = create(:series, :now_showing, name: 'Series 2', episodes: 2, watched: 3, program:)

			list = described_class.incomplete

			expect(list.first).to have_attributes id: first_series.id, name: first_series.name, now_showing: nil, program_id: program.id, program_name: program.name, episode_count: 15, watched_count: 2, recorded_count: 3, expected_count: 4
			expect(list.second).to have_attributes id: second_series.id, name: second_series.name, now_showing: 1, program_id: program.id, program_name: program.name, episode_count: 5, watched_count: 3, recorded_count: 0, expected_count: 0
		end

		it 'should not include series that are not yet started or are completed' do
			incomplete_series = create(:series, episodes: 1, watched: 1)
			completed_series = create(:series, watched: 1)
			unstarted_series = create(:series, episodes: 1)

			list = described_class.incomplete

			expect(list).to include incomplete_series
			expect(list).not_to include completed_series
			expect(list).not_to include unstarted_series
		end

		it 'should return the list of series sorted by program name, then series name' do
			program_two = create(:program, name: 'Program 2')
			program_one = create(:program, name: 'Program 1')
			create(:series, name: 'Series 3', program: program_two, episodes: 1, watched: 1)
			create(:series, name: 'Series 2', program: program_one, episodes: 1, watched: 1)
			create(:series, name: 'Series 1', program: program_two, episodes: 1, watched: 1)

			expect(described_class.incomplete.map { [_1.program_name, _1.name] }).to eq [
				['Program 1', 'Series 2'],
				['Program 2', 'Series 1'],
				['Program 2', 'Series 3']
			]
		end
	end

	describe '::list_by_status' do
		shared_examples 'series list by status' do |status|
			it "should return the list of series with at least one #{status} episode and their count of episodes by status" do
				program = create(:program)
				first_series = create(:series, name: 'Series 1', program:)
				second_series = create(:series, :now_showing, name: 'Series 2', program:)
				create(:episode, series: first_series, status:)
				create(:episode, series: second_series, status:)

				list = described_class.list_by_status status

				expect(list.first).to have_attributes id: first_series.id, name: first_series.name, now_showing: nil, program_id: program.id, program_name: program.name, episode_count: 1, "#{status}_count": 1
				expect(list.second).to have_attributes id: second_series.id, name: second_series.name, now_showing: 1, program_id: program.id, program_name: program.name, episode_count: 1, "#{status}_count": 1
			end

			it "should not include series with no #{status} episodes" do
				status_episode = create(:episode, status:)
				non_status_episode = create(:episode)

				list = described_class.list_by_status status

				expect(list).to include status_episode.series
				expect(list).not_to include non_status_episode.series
			end

			it 'should return the list of series sorted by program name, then series name' do
				program_two = create(:program, name: 'Program 2')
				program_one = create(:program, name: 'Program 1')
				series_three = create(:series, name: 'Series 3', program: program_two)
				series_two = create(:series, name: 'Series 2', program: program_one)
				series_one = create(:series, name: 'Series 1', program: program_two)
				create(:episode, series: series_one, status:)
				create(:episode, series: series_two, status:)
				create(:episode, series: series_three, status:)

				expect(described_class.list_by_status(status).map { [_1.program_name, _1.name] }).to eq [
					['Program 1', 'Series 2'],
					['Program 2', 'Series 1'],
					['Program 2', 'Series 3']
				]
			end
		end

		context 'watched' do
			it_behaves_like 'series list by status', :watched
		end

		context 'recorded' do
			it_behaves_like 'series list by status', :recorded
		end

		context 'expected' do
			it_behaves_like 'series list by status', :expected
		end

		context 'missed' do
			it_behaves_like 'series list by status', :missed
		end
	end
end
