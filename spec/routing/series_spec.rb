# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require 'spec_helper'

describe 'series routes' do
	# Collection routes
	it 'should not route GET /series' do
		expect(get: '/series').to route_to controller: 'application', action: 'routing_error', unmatched_route: 'series'
	end

	it 'should route GET /programs/:id/series to series#index' do
		expect(get: '/programs/1/series').to route_to controller: 'series', action: 'index', program_id: '1'
	end

	it 'should not route POST /series' do
		expect(post: '/series').not_to be_routable
	end

	it 'should route POST /programs/:id/series to series#create' do
		expect(post: '/programs/1/series').to route_to controller: 'series', action: 'create', program_id: '1'
	end

	it 'should route GET /series/count to series#count' do
		expect(get: '/series/count').to route_to controller: 'series', action: 'count'
	end

	# Member routes
	it 'should route GET /series/:id to series#show' do
		expect(get: '/series/1').to route_to controller: 'series', action: 'show', id: '1'
	end

	it 'should not route GET /series/:id/edit' do
		expect(get: '/series/1/edit').to route_to controller: 'application', action: 'routing_error', unmatched_route: 'series/1/edit'
	end

	it 'should route PATCH /series/:id to series#update' do
		expect(patch: '/series/1').to route_to controller: 'series', action: 'update', id: '1'
	end

	it 'should route PUT /series/:id to series#update' do
		expect(put: '/series/1').to route_to controller: 'series', action: 'update', id: '1'
	end

	it 'should route DELETE /series/:id to series#destroy' do
		expect(delete: '/series/1').to route_to controller: 'series', action: 'destroy', id: '1'
	end

	# Other routes
	it 'should route GET /scheduled to series#scheduled' do
		expect(get: '/scheduled').to route_to controller: 'series', action: 'scheduled'
	end
end
