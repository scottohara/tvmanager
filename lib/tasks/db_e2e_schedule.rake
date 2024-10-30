# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require_relative 'db_e2e'

::DB::E2E.create_test_data(:schedule) do
	program = create :program, name: 'Program Z'
	create(:series, name: 'Series S', expected: 1, program:)
	create(:series, name: 'Series R', recorded: 1, program:)
	create(:series, name: 'Series P', now_showing: 8, program:)
	create(:series, name: 'Series N', now_showing: 7, program:)
	create(:series, name: 'Series L', now_showing: 6, program:)
	create(:series, name: 'Series J', now_showing: 5, program:)
	create(:series, name: 'Series H', now_showing: 4, program:)
	create(:series, name: 'Series F', now_showing: 3, program:)
	create(:series, name: 'Series D', now_showing: 2, episodes: 2, program:)
	create(:series, name: 'Series B', now_showing: 1, watched: 1, program:)
	program = create :program, name: 'Program A'
	create(:series, name: 'Series Q', watched: 1, recorded: 1, expected: 1, program:)
	create(:series, name: 'Series O', now_showing: 8, watched: 1, recorded: 1, expected: 1, program:)
	create(:series, name: 'Series M', now_showing: 7, watched: 1, recorded: 1, expected: 1, program:)
	create(:series, name: 'Series K', now_showing: 6, watched: 1, recorded: 1, expected: 1, program:)
	create(:series, name: 'Series I', now_showing: 5, watched: 1, recorded: 1, expected: 1, program:)
	create(:series, name: 'Series G', now_showing: 4, watched: 1, recorded: 1, expected: 1, program:)
	create(:series, name: 'Series E', now_showing: 3, expected: 1, program:)
	create(:series, name: 'Series C', now_showing: 2, episodes: 2, recorded: 1, expected: 1, program:)
	series = create(:series, name: 'Series A', now_showing: 1, episodes: 1, watched: 1, recorded: 1, missed: 1, program:)
	create(:episode, :expected, status_date: '2000-01-01', series:)
end
