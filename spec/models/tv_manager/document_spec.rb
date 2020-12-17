# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require_relative '../../spec_helper'
require_relative '../../../app/models/document'

describe ::TVManager::Document do
	let(:device_id) { 'test_device_id' }
	let(:document_id) { 'test_document_id' }
	let(:document_doc) { {'type' => 'document', 'name' => 'test document'} }
	let(:other_devices) { %w[device_1 device_2 device_3] }

	matcher :match_document do |expected|
		match do |actual|
			actual.keys.reject { |key| actual[key].eql? expected[key] }.empty?
		end
	end

	describe '::all' do
		include_context 'database interaction' do
			let(:documents) { Array(1..3).map { |i| document_doc.merge 'id' => "document_#{i}" } }
			let(:fixtures) { documents }
			let(:json) do
				fixtures.reverse.map! do |doc|
					{
						'id' => doc['_id'],
						'key' => doc['_id'],
						'value' => nil,
						'doc' => {
							'_id' => doc['_id'],
							'_rev' => doc['_rev'],
							'type' => doc['type'],
							'name' => doc['name'],
							'id' => doc['id']
						}
					}
				end
			end
			let(:stream) { {data: json, checksum: ::Digest::MD5.hexdigest(json.to_json)} }
		end

		it 'should return the list of all documents' do
			out = +''	# The '+' unary operator gives us an unfrozen string
			described_class.all.call out
			expect(out).to eql stream.to_json
		end
	end

	describe '::pending' do
		include_context 'database interaction' do
			let(:documents) { Array(1..3).map { |i| document_doc.merge 'id' => "document_#{i}", pending: [device_id] } }
			let(:fixtures) { documents }
			let(:json) do
				fixtures.reverse.map! do |doc|
					{
						'id' => doc['_id'],
						'key' => device_id,
						'value' => nil,
						'doc' => {
							'_id' => doc['_id'],
							'_rev' => doc['_rev'],
							'type' => doc['type'],
							'name' => doc['name'],
							'id' => doc['id'],
							'pending' => [device_id]
						}
					}
				end
			end
		end

		it 'should return a list of pending documents for the device' do
			expect(described_class.pending device_id).to eql json
		end
	end

	describe '#new' do
		context 'from document id' do
			it 'should return a Document initialised with the specified document id' do
				document = described_class.new document_id
				expect(document).to be_a described_class
				expect(document.instance_variable_get :@id).to eql document_id
			end
		end

		context 'from document json' do
			let(:json) { document_doc.merge 'id' => document_id }

			shared_examples 'a Document constructor' do
				it 'should return a Document instance' do
					document = described_class.new json
					expect(document).to be_a described_class
					expect(document.instance_variable_get :@id).to eql document_id
					expect(document.instance_variable_get :@document).to be json
					expect(json['_id']).to eql document_id
					expect(json['_rev']).to eql fixtures.first['_rev'] if defined? fixtures
				end
			end

			context 'for new document' do
				it_behaves_like 'a Document constructor'
			end

			context 'for existing document' do
				include_context 'database interaction' do
					let(:fixtures) { [json] }
				end

				it_behaves_like 'a Document constructor'
			end
		end
	end

	describe '#save!' do
		let(:json) { document_doc.merge 'id' => document_id }

		shared_examples 'a saved document' do
			it 'should save the document' do
				document = described_class.new json
				document_id = document.save! save_device_id
				saved_document = described_class.new(document_id).document
				expect(saved_document).to match_document json
			end
		end

		context 'with no device id specified' do
			let(:save_device_id) { nil }

			before do
				expect(::TVManager::Device).not_to receive :other_devices
			end

			context 'new document' do
				it_behaves_like 'a saved document'
			end

			context 'existing document' do
				include_context 'database interaction' do
					let(:fixtures) { [json] }
				end

				it_behaves_like 'a saved document'
			end
		end

		context 'with a device id specified' do
			let(:save_device_id) { device_id }

			before do
				expect(::TVManager::Device).to receive(:other_devices).with(device_id).and_return other_devices
			end

			context 'new document' do
				it_behaves_like 'a saved document'
			end

			context 'existing document' do
				include_context 'database interaction' do
					let(:fixtures) { [json] }
				end

				it_behaves_like 'a saved document'
			end
		end
	end

	describe '#delete!' do
		context 'non-existant document' do
			it 'should do nothing' do
				expect(::TVManager::Device).not_to receive :other_devices
				described_class.new(document_id).delete! device_id
			end
		end

		context 'existing document' do
			include_context 'database interaction' do
				let(:fixtures) { [document_doc.merge('_id' => document_id)] }
			end

			context 'with no other devices' do
				it 'should delete the document' do
					expect(::TVManager::Device).to receive(:other_devices).with(device_id).and_return []
					described_class.new(document_id).delete! device_id
					expect(described_class.new(document_id).document).to be nil
				end
			end

			context 'with other devices' do
				it 'should mark the document as deleted and notify all other devices' do
					expect(::TVManager::Device).to receive(:other_devices).with(device_id).and_return(other_devices).twice
					described_class.new(document_id).delete! device_id
					saved_document = described_class.new(document_id).document
					expect(saved_document['isDeleted']).to be true
					expect(saved_document['pending']).to eql other_devices
				end
			end
		end
	end

	describe '#remove_pending' do
		let(:document) { described_class.new document_id }

		context 'from non-existant document' do
			it 'should do nothing' do
				expect(document).not_to receive :save!
				document.remove_pending! device_id
			end
		end

		context 'from existing document' do
			include_context 'database interaction' do
				let(:fixtures) { [document_doc.merge('_id' => document_id, isDeleted: is_deleted, pending: pending_devices)] }
			end

			shared_examples 'a saved document' do
				it 'should save the document' do
					document.remove_pending! device_id
					expect(described_class.new(document_id).document['pending']).to eql pending_devices_after
				end
			end

			context 'not marked as deleted' do
				let(:is_deleted) { false }

				context 'with no pending devices' do
					let(:pending_devices) { [device_id] }
					let(:pending_devices_after) { [] }

					it_behaves_like 'a saved document'
				end

				context 'with pending devices' do
					let(:pending_devices) { other_devices + [device_id] }
					let(:pending_devices_after) { other_devices }

					it_behaves_like 'a saved document'
				end
			end

			context 'marked as deleted' do
				let(:is_deleted) { true }

				context 'with no pending devices' do
					let(:pending_devices) { [device_id] }

					it 'should delete the document' do
						document.remove_pending! device_id
						expect(described_class.new(document_id).document).to be nil
					end
				end

				context 'with pending devices' do
					let(:pending_devices) { other_devices + [device_id] }
					let(:pending_devices_after) { other_devices }

					it_behaves_like 'a saved document'
				end
			end
		end
	end

	describe '#document' do
		let(:document) { described_class.new document_id }

		before do
			expect(document.db).to receive(:get).with(document_id).and_call_original.once
		end

		context 'when the document id is not found' do
			it 'should return nil' do
				expect(document.document).to be nil
			end
		end

		context 'when the document id is found' do
			include_context 'database interaction' do
				let(:fixtures) { [document_doc.merge('_id' => document_id, 'id' => document_id)] }
			end

			it 'should return the document' do
				expect(document.document).to be_a ::CouchRest::Document
				expect(document.document).to match_document fixtures.first
			end
		end
	end
end
