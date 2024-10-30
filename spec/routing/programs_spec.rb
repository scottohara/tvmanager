# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require 'spec_helper'

describe 'programs routes' do
	# Collection routes
	it 'should route GET /programs to programs#index' do
		expect(get: '/programs').to route_to controller: 'programs', action: 'index'
	end

	it 'should route POST /programs to programs#create' do
		expect(post: '/programs').to route_to controller: 'programs', action: 'create'
	end

	it 'should route GET /programs/count to programs#count' do
		expect(get: '/programs/count').to route_to controller: 'programs', action: 'count'
	end

	# Member routes
	it 'should route GET /programs/:id to programs#show' do
		expect(get: '/programs/1').to route_to controller: 'programs', action: 'show', id: '1'
	end

	it 'should not route GET /programs/:id/edit' do
		expect(get: '/programs/1/edit').to route_to controller: 'application', action: 'routing_error', unmatched_route: 'programs/1/edit'
	end

	it 'should route PATCH /programs/:id to programs#update' do
		expect(patch: '/programs/1').to route_to controller: 'programs', action: 'update', id: '1'
	end

	it 'should route PUT /programs/:id to programs#update' do
		expect(put: '/programs/1').to route_to controller: 'programs', action: 'update', id: '1'
	end

	it 'should route DELETE /programs/:id to programs#destroy' do
		expect(delete: '/programs/1').to route_to controller: 'programs', action: 'destroy', id: '1'
	end
end
