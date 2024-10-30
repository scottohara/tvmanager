# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require_relative 'db_e2e'

::DB::E2E.create_test_data(:programs) do
	program = create :program, name: 'Test Program'
	create(:series, episodes: 1, watched: 1, recorded: 1, expected: 1, missed: 1, program:)
	create(:series, program:)
	create(:series, watched: 1, program:)
	create :program, name: 'R08'
	create :program, name: 'R07'
	create :program, name: 'R06'
	create :program, name: 'R05'
	create :program, name: 'R04'
	create :program, name: 'R03'
	create :program, name: 'R02'
	create :program, name: 'R01'
	create :program, name: 'M01'
	create :program, name: 'D15'
	create :program, name: 'D14'
	create :program, name: 'D13'
	create :program, name: 'D12'
	create :program, name: 'D11'
	create :program, name: 'D10'
	create :program, name: 'D09'
	create :program, name: 'D08'
	create :program, name: 'D07'
	create :program, name: 'D06'
	create :program, name: 'D05'
	create :program, name: 'D04'
	create :program, name: 'D03'
	create :program, name: 'D02'
	create :program, name: 'D01'
	program = create :program, name: 'Another Test Program'
	create(:series, watched: 1, recorded: 1, expected: 1, program:)
	series = create(:series, episodes: 1, program:)
	create(:episode, :expected, status_date: '2000-01-01', series:)
end
