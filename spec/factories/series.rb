# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

::FactoryBot.define do
	factory :series do
		sequence(:name) { "Series #{_1}" }
		program

		transient do
			episodes { 0 }
			watched { 0 }
			recorded { 0 }
			expected { 0 }
			expected_overdue { 0 }
			missed { 0 }
		end

		after :build do |series, evaluator|
			create_list(:episode, evaluator.episodes, series:)
			create_list(:episode, evaluator.watched, :watched, series:)
			create_list(:episode, evaluator.recorded, :recorded, series:)
			create_list(:episode, evaluator.expected, :expected, series:)
			create_list(:episode, evaluator.expected_overdue, :expected_overdue, series:)
			create_list(:episode, evaluator.missed, :missed, series:)
		end

		trait :now_showing do
			now_showing { 1 }
		end
	end
end
