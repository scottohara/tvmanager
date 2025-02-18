# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

# Episode
class Episode < ApplicationRecord
	belongs_to :series
	enum :status, %w[watched recorded expected missed].index_by(&:to_sym)
	validates :name, :sequence, presence: true
	validates :unverified, :unscheduled, inclusion: {in: [true, false]}
	validates :sequence, numericality: {only_integer: true}

	class << self
		def list(series_id)
			select(*list_fields)
				.joins(series: :program)
				.where(series_id:)
				.order(
					'episodes.sequence',
					'episodes.id'
				)
		end

		def unscheduled
			select(*list_fields)
				.joins(series: :program)
				.where(unscheduled: true)
				.order(
					'episodes.status_date',
					'programs.name',
					'series.name'
				)
		end

		private

		def list_fields
			[
				'episodes.id',
				'episodes.name',
				'episodes.status',
				'episodes.status_date',
				'episodes.unverified',
				'episodes.unscheduled',
				'episodes.sequence',
				'episodes.series_id',
				'series.name AS series_name',
				'programs.name AS program_name'
			]
		end
	end
end
