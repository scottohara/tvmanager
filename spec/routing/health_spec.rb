# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require 'spec_helper'

describe 'health routes' do
	it 'should route GET /up to rails/health#show' do
		expect(get: '/up').to route_to controller: 'rails/health', action: 'show'
	end
end
