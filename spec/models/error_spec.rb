# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require_relative '../spec_helper'
require_relative '../../app/models/error'

describe HttpError do
	it 'should have a status attribute' do
		expect(described_class).to respond_to :status
	end
end

shared_examples 'a http error' do |status|
	it "should have a #{status} status" do
		expect(described_class.status).to be status
	end
end

describe BadRequest do
	it_behaves_like 'a http error', 400
end

describe Forbidden do
	it_behaves_like 'a http error', 403
end

describe NotFound do
	it_behaves_like 'a http error', 404
end

describe Conflict do
	it_behaves_like 'a http error', 409
end

describe InternalServerError do
	it_behaves_like 'a http error', 500
end
