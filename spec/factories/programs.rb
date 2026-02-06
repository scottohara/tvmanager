# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

::FactoryBot.define do
	factory :program do
		sequence(:name) { "Program #{it}" }

		transient do
			series { 0 }
			episodes { 0 }
			watched { 0 }
			recorded { 0 }
			expected { 0 }
			missed { 0 }
		end

		after :build do |program, evaluator|
			create_list(
				:series,
				evaluator.series,
				episodes: evaluator.episodes,
				watched: evaluator.watched,
				recorded: evaluator.recorded,
				expected: evaluator.expected,
				missed: evaluator.missed,
				program:
			)
		end
	end
end
