# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require_relative 'db_e2e'

::DB::E2E.create_test_data(:episodes) do
	program = create :program, name: 'Test Program'
	series = create(:series, name: 'Test Series', program:)
	create(:episode, :watched, name: 'Episode A', series:)
	create(:episode, :recorded, name: 'Episode B', status_date: '2000-01-01', series:)
	create(:episode, :recorded, :unverified, :unscheduled, name: 'Episode C', status_date: '2000-01-02', series:)
	create(:episode, :expected, name: 'Episode D', status_date: '2000-01-03', series:)
	create(:episode, :missed, name: 'Episode E', status_date: '2000-01-04', series:)
	create(:episode, :missed, :unverified, name: 'Episode F', status_date: '2000-01-05', series:)
	create(:episode, :expected, name: 'Episode G', status_date: '2100-01-01', series:)
	create(:episode, :expected, :unverified, name: 'Episode H', status_date: '2100-01-02', series:)
	create(:episode, name: 'Episode I', series:)
end
