# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require 'spec_helper'

describe 'episodes routes' do
	# Collection routes
	it 'should not route GET /episodes' do
		expect(get: '/episodes').to route_to controller: 'application', action: 'routing_error', unmatched_route: 'episodes'
	end

	it 'should route GET /series/:id/episodes to episodes#index' do
		expect(get: '/series/1/episodes').to route_to controller: 'episodes', action: 'index', series_id: '1'
	end

	it 'should not route POST /episodes' do
		expect(post: '/episodes').not_to be_routable
	end

	it 'should route POST /series/:id/episodes to episodes#create' do
		expect(post: '/series/1/episodes').to route_to controller: 'episodes', action: 'create', series_id: '1'
	end

	it 'should route GET /episodes/count to episodes#count' do
		expect(get: '/episodes/count').to route_to controller: 'episodes', action: 'count'
	end

	it 'should route GET /episodes/:status/count to episodes#count_by_status' do
		expect(get: '/episodes/watched/count').to route_to controller: 'episodes', action: 'count_by_status', status: 'watched'
	end

	# Member routes
	it 'should route GET /episodes/:id to episodes#show' do
		expect(get: '/episodes/1').to route_to controller: 'episodes', action: 'show', id: '1'
	end

	it 'should not route GET /episodes/:id/edit' do
		expect(get: '/episodes/1/edit').to route_to controller: 'application', action: 'routing_error', unmatched_route: 'episodes/1/edit'
	end

	it 'should route PATCH /episodes/:id to episodes#update' do
		expect(patch: '/episodes/1').to route_to controller: 'episodes', action: 'update', id: '1'
	end

	it 'should route PUT /episodes/:id to episodes#update' do
		expect(put: '/episodes/1').to route_to controller: 'episodes', action: 'update', id: '1'
	end

	it 'should route DELETE /episodes/:id to episodes#destroy' do
		expect(delete: '/episodes/1').to route_to controller: 'episodes', action: 'destroy', id: '1'
	end

	# Other routes
	it 'should route GET /unscheduled to episodes#unscheduled' do
		expect(get: '/unscheduled').to route_to controller: 'episodes', action: 'unscheduled'
	end
end
