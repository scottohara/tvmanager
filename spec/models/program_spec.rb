# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require 'rails_helper'

::RSpec.describe ::Program do
	it 'should be invalid without a name' do
		expect(build :program, name: nil).not_to be_valid
	end

	describe '::list' do
		it 'should return the list of programs and their count of series and episodes by status' do
			first_program = create(:program, name: 'Program 1', series: 2, episodes: 1, watched: 2, recorded: 3, expected: 4, missed: 5)
			second_program = create(:program, name: 'Program 2', series: 1)
			third_program = create(:program, name: 'Program 3')

			list = described_class.list

			expect(list.first).to have_attributes id: first_program.id, name: first_program.name, series_count: 2, episode_count: 30, watched_count: 4, recorded_count: 6, expected_count: 8
			expect(list.second).to have_attributes id: second_program.id, name: second_program.name, series_count: 1, episode_count: 0, watched_count: 0, recorded_count: 0, expected_count: 0
			expect(list.third).to have_attributes id: third_program.id, name: third_program.name, series_count: 0, episode_count: 0, watched_count: 0, recorded_count: 0, expected_count: 0
		end

		it 'should return the list of programs sorted by name' do
			create(:program, name: 'Program 3')
			create(:program, name: 'Program 1')
			create(:program, name: 'Program 4')
			create(:program, name: 'Program 2')

			expect(described_class.list.map(&:name)).to eq ['Program 1', 'Program 2', 'Program 3', 'Program 4']
		end
	end
end
