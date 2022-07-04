# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require_relative '../../spec_helper'
require_relative '../../../app/controllers/documents_controller'

describe ::TVManager::DocumentsController do
	def app
		described_class
	end

	let(:device_id) { 'test_device_id' }
	let(:document_id) { 'test_document_id' }
	let(:device) { instance_double ::TVManager::Device }
	let(:document) { instance_double ::TVManager::Document }
	let(:json) { {}.to_json }
	let(:doc) { ::JSON.parse json }

	shared_examples 'a route requiring a client device id' do
		it 'should respond with a 400 Bad Request if a client device id is not specified' do
			expect(::TVManager::Device).to receive(:id).and_raise ::TVManager::BadRequest, 'forced error'
			public_send(*request)
			expect(last_response.status).to be 400
			expect(last_response.body).to eql 'forced error'
		end
	end

	shared_context 'device id specified' do
		before do
			expect(::TVManager::Device).to receive(:id).and_return device_id
		end
	end

	shared_examples 'an unauthorised route' do
		it_behaves_like 'a route requiring a client device id'

		context 'when a device id is specified' do
			include_context 'device id specified'

			it 'should not check the device access' do
				allow(::TVManager::Device).to receive(:new).with(device_id).and_return device
				public_send(*request)
				expect(device).not_to receive :check_access
			end
		end
	end

	shared_examples 'an authorised route' do
		it_behaves_like 'a route requiring a client device id'

		context 'when a device id is specified' do
			include_context 'device id specified'

			it 'should respond with a 400 Bad Request if the client device is not registered' do
				expect(::TVManager::Device).to receive(:new).with(device_id).and_raise ::TVManager::BadRequest, 'forced error'
				public_send(*request)
				expect(last_response.status).to be 400
				expect(last_response.body).to eql 'forced error'
			end

			it 'should respond with a 403 Forbidden if the client device is readonly' do
				expect(::TVManager::Device).to receive(:new).with(device_id).and_return device
				expect(device).to receive(:check_access).and_raise ::TVManager::Forbidden, 'forced error'
				public_send(*request)
				expect(last_response.status).to be 403
				expect(last_response.body).to eql 'forced error'
			end
		end
	end

	shared_context 'authorised device' do
		include_context 'device id specified'

		before do
			expect(::TVManager::Device).to receive(:new).with(device_id).and_return device
			expect(device).to receive(:check_access)
			allow(::TVManager::Document).to receive(:new).with(document_id).and_return document
			allow(::TVManager::Document).to receive(:new).with(doc).and_return document
		end
	end

	describe 'GET /documents/all' do
		let(:request) { [:get, '/all'] }
		let(:all_proc) { proc { |out| out << json } }

		before do
			allow(::TVManager::Document).to receive(:all).and_return all_proc
		end

		it_behaves_like 'an unauthorised route'

		context 'route' do
			include_context 'device id specified'

			it 'should respond with a list of all documents' do
				public_send(*request)
				expect(last_response.status).to be 200
				expect(last_response.body).to eql json
				expect(last_response.headers['Content-Type']).to eql 'application/json'
			end
		end
	end

	describe 'GET /documents/pending' do
		let(:request) { [:get, '/pending'] }
		let(:checksum) { ::Digest::MD5.hexdigest json }

		before do
			allow(::TVManager::Document).to receive(:pending).with(device_id).and_return doc
		end

		it_behaves_like 'an unauthorised route'

		context 'route' do
			include_context 'device id specified'

			it 'should respond with a list of pending documents' do
				public_send(*request)
				expect(last_response.status).to be 200
				expect(last_response.body).to eql json
				expect(last_response.headers['Etag']).to eql "\"#{checksum}\""
				expect(last_response.headers['Content-Type']).to eql 'application/json'
			end
		end
	end

	describe 'POST /documents' do
		let(:headers) { {} }
		let(:request) { [:post, '/', json, headers] }

		it_behaves_like 'an authorised route'

		context 'route' do
			include_context 'authorised device'

			before do
				headers['HTTP_CONTENT_MD5'] = checksum
			end

			context 'checksum mismatch' do
				let(:checksum) { 'invalid' }

				it 'should respond with a 400 Bad Request' do
					public_send(*request)
					expect(last_response.status).to be 400
					expect(last_response.body).to eql "Checksum mismatch on received change (#{::Digest::MD5.hexdigest json} != #{checksum})"
				end
			end

			context 'checksum match' do
				let(:checksum) { ::Digest::MD5.hexdigest json }

				before do
					expect(document).to receive(:save!).with(device_id)
					public_send(*request)
				end

				it 'should save the document' do
					expect(last_response.status).to be 200
				end

				it 'should respond with an etag containing the MD5 checksum' do
					expect(last_response.headers['Etag']).to eql "\"#{checksum}\""
				end
			end
		end
	end

	describe 'DELETE /documents/:id' do
		let(:request) { [:delete, "/#{document_id}"] }

		it_behaves_like 'an authorised route'

		context 'route' do
			include_context 'authorised device'

			it 'should delete the document' do
				expect(document).to receive(:delete!).with device_id
				public_send(*request)
				expect(last_response.status).to be 200
			end
		end
	end

	describe 'DELETE /documents/:id/pending' do
		let(:request) { [:delete, "/#{document_id}/pending"] }

		it_behaves_like 'an authorised route'

		context 'route' do
			include_context 'authorised device'

			it 'should remove a pending device from the document' do
				expect(document).to receive(:remove_pending!).with device_id
				public_send(*request)
				expect(last_response.status).to be 200
			end
		end
	end
end
