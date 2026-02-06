# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

::FactoryBot.define do
	factory :episode do
		sequence(:name) { "Episode #{it}" }
		series

		transient do
			seq { nil }
		end

		after :build do |episode, evaluator|
			episode.sequence = evaluator.seq || (::Episode.where(series: episode.series).count + 1)
		end

		trait :watched do
			status { :watched }
		end

		trait :recorded do
			status { :recorded }
			past_date
		end

		trait :expected do
			status { :expected }
			future_date
		end

		trait :expected_overdue do
			status { :expected }
			past_date
		end

		trait :missed do
			status { :missed }
			past_date
		end

		trait :past_date do
			sequence(:status_date) { ::Time.zone.today - it }
		end

		trait :future_date do
			sequence(:status_date) { ::Time.zone.today + it }
		end

		trait :unverified do
			unverified { true }
		end

		trait :unscheduled do
			unscheduled { true }
		end
	end
end
