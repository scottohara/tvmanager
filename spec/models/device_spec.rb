require_relative '../spec_helper'
require_relative '../../app/models/device'

describe TVManager::Device do
	let(:device_id) { "test_device_id" }
	let(:device_name) { "test device" }
	let(:device_doc) { {"_id" => device_id, type: "device" } }
	let(:unauthorised_device) { device_doc.merge "readOnly" => true }
	let(:authorised_device) { device_doc.merge "readOnly" => false }

	describe "::id" do
		let(:request) { MockRequest::Request.new }

		it "should raise an error when a device id is not supplied" do
			expect{described_class.id request}.to raise_error BadRequest, "Client device identifier was not supplied"
		end

		it "should raise an error when a device id is blank" do
			request.env["HTTP_X_DEVICE_ID"] = ""
			expect{described_class.id request}.to raise_error BadRequest, "Client device identifier was not supplied"
		end

		it "should return the specified device id from the request" do
			request.env["HTTP_X_DEVICE_ID"] = device_id
			expect(described_class.id request).to eq device_id
		end
	end

	describe "::other_devices" do
		context "no other devices" do
			include_context "database interaction" do
				let(:fixtures) { [device_doc] }
			end

			it "should return an empty array" do
				expect(described_class.other_devices device_id).to be_empty
			end
		end

		context "other devices" do
			include_context "database interaction" do
				let(:other_devices) { [*1..3].map do |i|
					new_device = device_doc.clone
					new_device["_id"] = "#{new_device["_id"]}_#{i}"
					new_device
				end }

				let(:fixtures) { other_devices << device_doc }
			end

			it "should return an array of device ids excluding the current device" do
				expect(described_class.other_devices device_id).to eql %w(test_device_id_1 test_device_id_2 test_device_id_3)
			end
		end
	end

	describe "#new" do
		shared_examples "a Device constructor" do
			it "should return a Device instance" do
				device = described_class.new device_id
				expect(device).to be_a described_class
				expect(device.id).to eql device_id
				expect(device.instance_variable_get :@device).to eql device_doc
			end
		end

		context "when a device id is specified" do
			let(:device_doc) { nil }

			it_behaves_like "a Device constructor"
		end

		context "when a device id is not specified" do
			let(:device_id) { nil }
			let(:device_doc) { {type: "device", readOnly: true} }

			it_behaves_like "a Device constructor"
		end
	end

	describe "#check_access" do
		let(:device) { described_class.new device_id }

		context "when the device is readonly" do
			include_context "database interaction" do
				let(:fixtures) { [unauthorised_device] }
			end

			it "should raise an error" do
				expect{device.check_access}.to raise_error Forbidden, "Client device #{device_id} is not authorised to export"
			end
		end

		context "when the device is not readonly" do
			include_context "database interaction" do
				let(:fixtures) { [authorised_device] }
			end

			it "should do nothing" do
				expect{device.check_access}.to_not raise_error
			end
		end
	end

	describe "#name=" do
		let(:device) { described_class.new nil }

		it "should set the device name" do
			device.name = device_name
			expect(device.document["name"]).to eql device_name
		end
	end

	describe "#save!" do
		let(:device) { described_class.new device_id }

		shared_examples "a saved device" do
			it "should save the device" do
				device.name = device_name
				device_id = device.save!
				saved_device = described_class.new(device_id).document
				expect(saved_device["name"]).to eql device_name
				expect(saved_device["type"]).to eql "device"
				expect(saved_device["readOnly"]).to be read_only
			end
		end

		context "register new device" do
			let(:device_id) { nil }
			let(:read_only) { true }

			it_behaves_like "a saved device"
		end

		context "update existing device" do
			let(:read_only) { authorised_device["readOnly"] }

			include_context "database interaction" do
				let(:fixtures) { [authorised_device] }
			end

			it_behaves_like "a saved device"
		end
	end

	describe "#delete!" do
		let(:device) { described_class.new device_id }
		let(:document) { instance_double "TVManager::Document" }

		include_context "database interaction" do
			let(:documents) { [*1..3].map{|i| {"_id" => "document_#{i}", type: "document", pending: [device_id]}} }
			let(:fixtures) { documents + [authorised_device] }
		end

		it "should remove the device from all pending documents and delete the device" do
			documents.each{|doc| expect(TVManager::Document).to receive(:new).with(doc["_id"]).and_return document}
			expect(document).to receive(:remove_pending!).with(device_id).thrice
			device.delete!
			expect{described_class.new(device_id).document}.to raise_error BadRequest, "Client device #{device_id} is not registered"
		end
	end

	describe "#document" do
		let(:device) { described_class.new device_id }

		before :each do
			expect(device.db).to receive(:get!).with(device_id).and_call_original.once
		end

		context "when the device id is not found" do
			it "should raise an error" do
				expect{device.document}.to raise_error BadRequest, "Client device #{device_id} is not registered"
			end
		end
		
		context "when the device id is found" do
			include_context "database interaction" do
				let(:fixtures) { [device_doc] }
			end

			it "should return the device document" do
				expect(device.document).to be_a CouchRest::Document
				expect(device.document["type"]).to eql device_doc[:type]
				expect(device.document["name"]).to eql device_doc[:name]
				expect(device.document["readOnly"]).to eql device_doc[:readOnly]
			end
		end
	end
end
