# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require_relative 'db_e2e'

::DB::E2E.create_test_data(:about) do
	program = create :program
	create(:series, episodes: 1, watched: 1, program:)
	create(:series, episodes: 1, program:)
	create(:series, episodes: 1)
end
