# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true
require_relative '../spec_helper'
require_relative '../../app/controllers/devices_controller'

describe TVManager::DevicesController do
	def app
		described_class
	end

	let(:device_id) { 'test_device_id' }
	let(:device) { instance_double 'TVManager::Device' }

	shared_examples 'a route requiring a client device id' do
		it 'should respond with a 400 Bad Request if a client device id is not specified' do
			expect(TVManager::Device).to receive(:id).and_raise BadRequest, 'forced error'
			public_send(*request)
			expect(last_response.status).to be 400
			expect(last_response.body).to eql 'forced error'
		end
	end

	shared_context 'device id specified' do
		before :each do
			expect(TVManager::Device).to receive(:id).and_return device_id
		end
	end

	shared_examples 'an authorised route' do
		context 'when a device id is specified' do
			include_context 'device id specified'

			it 'should respond with a 400 Bad Request if the client device is not registered' do
				expect(TVManager::Device).to receive(:new).with(device_id).and_raise BadRequest, 'forced error'
				public_send(*request)
				expect(last_response.status).to be 400
				expect(last_response.body).to eql 'forced error'
			end

			it 'should respond with a 403 Forbidden if the client device is readonly' do
				expect(TVManager::Device).to receive(:new).with(device_id).and_return device
				expect(device).to receive(:check_access).and_raise Forbidden, 'forced error'
				public_send(*request)
				expect(last_response.status).to be 403
				expect(last_response.body).to eql 'forced error'
			end
		end
	end

	shared_context 'authorised device' do
		include_context 'device id specified'

		before :each do
			expect(TVManager::Device).to receive(:new).with(device_id).and_return device
			expect(device).to receive(:check_access)
		end
	end

	describe 'PUT /devices/:name' do
		let(:device_name) { 'test-device' }
		let(:request) { [:put, "/#{device_name}"] }

		shared_examples 'the route' do
			it 'should save the device' do
				expect(device).to receive(:name=).with device_name
				expect(device).to receive(:save!).and_return device_id
				public_send(*request)
				expect(last_response.headers['Location']).to eql device_id
				expect(last_response.status).to be 200
			end
		end

		context 'register new device' do
			before :each do
				expect(TVManager::Device).to receive(:id).and_return nil
				expect(TVManager::Device).to receive(:new).with(nil).and_return device
				expect(device).not_to receive :check_access
			end

			it_behaves_like 'the route'
		end

		context 'update existing device' do
			it_behaves_like 'an authorised route'

			context 'route' do
				include_context 'authorised device'
				it_behaves_like 'the route'
			end
		end
	end

	describe 'DELETE /devices/:id' do
		let(:unregister_device_id) { device_id }
		let(:request) { [:delete, "/#{unregister_device_id}"] }

		it_behaves_like 'a route requiring a client device id'
		it_behaves_like 'an authorised route'

		context 'route' do
			include_context 'authorised device'

			context 'device mismatch' do
				let(:unregister_device_id) { 'another_device_id' }

				it 'should respond with a 403 Forbidden' do
					public_send(*request)
					expect(last_response.status).to be 403
					expect(last_response.body).to eql 'Client device can only unregister itself'
				end
			end

			context 'device match' do
				it 'should unregister the device' do
					expect(device).to receive :delete!
					public_send(*request)
					expect(last_response.status).to be 200
				end
			end
		end
	end
end
