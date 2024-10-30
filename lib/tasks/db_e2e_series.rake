# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require_relative 'db_e2e'

::DB::E2E.create_test_data(:series) do
	program = create :program, name: 'Test Program'
	create(:series, name: 'Series D', episodes: 1, watched: 1, recorded: 1, expected: 1, missed: 1, program:)
	create(:series, name: 'Series C', program:)
	create(:series, name: 'Series B', watched: 1, program:)
	create(:series, name: 'Series A', watched: 1, recorded: 1, expected: 1, program:)
	create :program, name: 'Test Program 2'
end
