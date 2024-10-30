# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require_relative 'db_e2e'

::DB::E2E.create_test_data(:unscheduled) do
	program = create :program, name: 'Program A'
	series = create(:series, name: 'Series A', program:)
	create(:episode, :watched, :unscheduled, name: 'Episode A', series:)
	create(:episode, :recorded, :unscheduled, name: 'Episode B', status_date: '2000-01-01', series:)
	create(:episode, :recorded, :unscheduled, :unverified, name: 'Episode C', status_date: '2000-01-02', series:)
	create(:episode, :expected, :unscheduled, name: 'Episode D', status_date: '2000-01-03', series:)
	create(:episode, :missed, :unscheduled, name: 'Episode E', status_date: '2000-01-04', series:)
	create(:episode, :missed, :unscheduled, :unverified, name: 'Episode F', status_date: '2000-01-05', series:)
	create(:episode, :expected, :unscheduled, name: 'Episode G', status_date: '2100-01-01', series:)
	create(:episode, :expected, :unscheduled, :unverified, name: 'Episode H', status_date: '2100-01-02', series:)
	create(:episode, :unscheduled, name: 'Episode I', series:)
	series = create(:series, name: 'Series B', program:)
	create(:episode, name: 'Episode J', series:)
	create(:episode, :unscheduled, name: 'Episode K', series:)
	program = create :program, name: 'Program B'
	series = create(:series, name: 'Series C', program:)
	create(:episode, :unscheduled, name: 'Episode L', series:)
end
