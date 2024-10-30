# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require 'spec_helper'

describe 'reports routes' do
	# Collection routes
	it 'should not route GET /reports' do
		expect(get: '/reports').to route_to controller: 'application', action: 'routing_error', unmatched_route: 'reports'
	end

	it 'should not route POST /reports' do
		expect(post: '/reports').not_to be_routable
	end

	it 'should route GET /reports/incomplete to reports#incomplete' do
		expect(get: '/reports/incomplete').to route_to controller: 'reports', action: 'incomplete'
	end

	# Member routes
	it 'should route GET /reports/:status to reports#status' do
		expect(get: '/reports/watched').to route_to controller: 'reports', action: 'status', status: 'watched'
	end

	it 'should not route GET /reports/:id/edit' do
		expect(get: '/reports/1/edit').to route_to controller: 'application', action: 'routing_error', unmatched_route: 'reports/1/edit'
	end

	it 'should not route PATCH /reports/:id' do
		expect(patch: '/reports/1').not_to be_routable
	end

	it 'should not route PUT /reports/:id' do
		expect(put: '/reports/1').not_to be_routable
	end

	it 'should not route DELETE /reports/:id' do
		expect(delete: '/reports/1').not_to be_routable
	end
end
