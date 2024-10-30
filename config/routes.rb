# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

::Rails.application.routes.draw do
	# Resource can be counted
	concern :countable do
		get 'count', on: :collection
	end

	resources :logins, only: :create

	resources :series, :episodes, only: [], concerns: :countable
	get 'episodes/:status/count', to: 'episodes#count_by_status', as: :count_status_episodes

	resources :programs, shallow: true, concerns: :countable do
		resources :series do
			resources :episodes
		end
	end

	resources :reports, only: [] do
		get 'incomplete', on: :collection
		get ':status', on: :collection, action: :status, as: :status
	end

	get 'scheduled', to: 'series#scheduled'
	get 'unscheduled', to: 'episodes#unscheduled'

	get 'up' => 'rails/health#show', as: :rails_health_check
	get '*unmatched_route', to: 'application#routing_error'
end
