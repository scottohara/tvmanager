# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

# Series
class Series < ApplicationRecord
	belongs_to :program
	has_many :episodes, dependent: :destroy
	validates :name, presence: true
	validates :now_showing, numericality: {only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 8}, allow_nil: true

	class << self
		def list(program_id)
			select(
				*list_fields,
				*status_counts
			)
				.joins(:program)
				.left_outer_joins(:episodes)
				.where(program_id:)
				.group(
					'series.id',
					'programs.name'
				)
				.order('series.name')
		end

		def scheduled
			select(
				*list_fields,
				*status_counts,
				# Counts the number of expected episodes that have reached their expected date
				"COUNT(CASE WHEN episodes.status = 'expected' AND episodes.status_date < CURRENT_DATE THEN 1 END) AS status_warning_count"
			)
				.joins(:program)
				.left_outer_joins(:episodes)
				.group(
					'series.id',
					'programs.name'
				)
				# Only include series that are either now showing, or have at least one recorded or expected episode
				.having(
					"series.now_showing IS NOT NULL OR COUNT(CASE WHEN episodes.status IN ('recorded', 'expected') THEN 1 END) > 0"
				)
				.order(
					'series.now_showing',
					'programs.name',
					'series.name'
				)
		end

		def incomplete
			select(
				*list_fields,
				*status_counts
			)
				.joins(:program)
				.left_outer_joins(:episodes)
				.group(
					'series.id',
					'programs.name'
				)
				# Only include series that have at least one watched episode and the total number of episodes is greater than the number of watched episodes
				.having(
					"COUNT(episodes.id) > COUNT(CASE WHEN episodes.status = 'watched' THEN 1 END) AND COUNT(CASE WHEN episodes.status = 'watched' THEN 1 END) > 0"
				)
				.order(
					'programs.name',
					'series.name'
				)
		end

		def list_by_status(status)
			select(
				*list_fields,
				"COUNT(episodes.id) AS #{status}_count"
			)
				.joins(:program, :episodes)
				.where(episodes: {status:})
				.group(
					'series.id',
					'programs.name'
				)
				.order(
					'programs.name',
					'series.name'
				)
		end

		private

		def list_fields
			[
				'series.id',
				'series.name',
				'series.now_showing',
				'series.program_id',
				'programs.name AS program_name',
				'COUNT(episodes.id) AS episode_count'
			]
		end

		def status_counts
			[
				"COUNT(CASE WHEN episodes.status = 'watched' THEN 1 END) AS watched_count",
				"COUNT(CASE WHEN episodes.status = 'recorded' THEN 1 END) AS recorded_count",
				"COUNT(CASE WHEN episodes.status = 'expected' THEN 1 END) AS expected_count"
			]
		end
	end
end
