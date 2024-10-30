# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

# Program
class Program < ApplicationRecord
	has_many :series, dependent: :destroy
	validates :name, presence: true

	class << self
		def list
			select(
				'programs.id',
				'programs.name',
				'COUNT(DISTINCT series.id) AS series_count',
				'COUNT(episodes.id) AS episode_count',
				"COUNT(CASE WHEN episodes.status = 'watched' THEN 1 END) AS watched_count",
				"COUNT(CASE WHEN episodes.status = 'recorded' THEN 1 END) AS recorded_count",
				"COUNT(CASE WHEN episodes.status = 'expected' THEN 1 END) AS expected_count"
			)
				.left_outer_joins(series: :episodes)
				.group('programs.id')
				.order('programs.name')
		end
	end
end
