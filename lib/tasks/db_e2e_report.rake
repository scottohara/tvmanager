# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require_relative 'db_e2e'

::DB::E2E.create_test_data(:status_report) do |status|
	program = create :program, name: 'Program Z'
	series = create(:series, name: 'Series C', program:)
	create(:episode, status:, series:)
	create(:episode, series:)
	create(:episode, status:, series:)
	create(:series, name: 'Series B', episodes: 1, status => 1, program:)
	create(:series, program:)
	program = create :program, name: 'Program A'
	create(:series, name: 'Series A', status => 2, program:)
	create(:series, episodes: 1, program:)
end

::DB::E2E.create_test_data(:incomplete_report) do
	program = create :program, name: 'Program Z'
	create(:series, watched: 2, program:)
	series = create(:series, name: 'Series C', program:)
	create(:episode, :watched, series:)
	create(:episode, :watched, series:)
	create(:episode, series:)
	create(:series, name: 'Series B', episodes: 1, watched: 1, program:)
	create(:series, program:)
	program = create :program, name: 'Program A'
	create(:series, name: 'Series A', episodes: 1, watched: 2, recorded: 1, expected: 1, missed: 1, program:)
	create(:series, episodes: 1, program:)
end
