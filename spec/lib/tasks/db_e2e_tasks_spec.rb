# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require 'rails_helper'
require 'rake'

# The rake file each e2e task is defined in, and the rows that task should create
E2E_TASKS = {
	'db_e2e_about.rake' => {
		'about' => {programs: 2, series: 3, episodes: 4}
	},
	'db_e2e_episodes.rake' => {
		'episodes' => {programs: 1, series: 1, episodes: 9}
	},
	'db_e2e_programs.rake' => {
		'programs' => {programs: 26, series: 5, episodes: 11}
	},
	'db_e2e_report.rake' => {
		'status_report' => {args: %w[watched], programs: 2, series: 5, episodes: 8},
		'incomplete_report' => {programs: 2, series: 6, episodes: 14}
	},
	'db_e2e_schedule.rake' => {
		'schedule' => {programs: 2, series: 19, episodes: 33}
	},
	'db_e2e_series.rake' => {
		'series' => {programs: 2, series: 4, episodes: 9}
	},
	'db_e2e_unscheduled.rake' => {
		'unscheduled' => {programs: 2, series: 3, episodes: 12}
	}
}.freeze

::RSpec.describe 'db:e2e rake tasks', type: :task do
	before do
		::Rake::Task.define_task :environment unless ::Rake::Task.task_defined? :environment
		allow(::ActiveRecord::Base).to receive :establish_connection
		allow(::ActiveRecord::Tasks::DatabaseTasks).to receive(:truncate_all) { ::Program.destroy_all }
	end

	after { ::Rake::Task.clear }

	it 'should exercise every e2e rake file' do
		expect(::Rails.root.glob('lib/tasks/db_e2e_*.rake').map { it.basename.to_s }).to match_array ::E2E_TASKS.keys
	end

	::E2E_TASKS.each do |file, definitions|
		describe file do
			before { load ::Rails.root.join 'lib/tasks', file }

			it 'should create the e2e test data' do
				definitions.each do |task, expected|
					::Rake::Task["db:e2e:#{task}"].invoke(*expected.fetch(:args, []))

					aggregate_failures "db:e2e:#{task}" do
						expect(::Program.count).to eq expected[:programs]
						expect(::Series.count).to eq expected[:series]
						expect(::Episode.count).to eq expected[:episodes]
					end
				end
			end
		end
	end
end
