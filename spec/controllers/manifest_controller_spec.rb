# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true
require_relative '../spec_helper'
require_relative '../../app/controllers/manifest_controller'

describe TVManager::ManifestController do
	def app
		described_class
	end

	describe 'GET /manifest' do
		shared_examples 'a cache manifest' do |type|
			it "should return a#{type} HTML5 cache manifest" do
				stub_const 'ENV', tvmanager_environment
				get '/'
				expect(last_response.content_type).to eql 'text/cache-manifest;charset=utf-8'
				expect(last_response.body).to eql cache_manifest
			end
		end

		context 'when app cache is disabled' do
			let(:tvmanager_environment) { {'TVMANAGER_NO_APPCACHE' => 'true'} }
			let(:cache_manifest) { "CACHE MANIFEST\nNETWORK:\n*" }
			it_behaves_like 'a cache manifest', 'n empty'
		end

		context 'when app cache is enabled' do
			let(:database_name) { 'test database name' }
			let(:app_version) { 'test app version' }
			let(:tvmanager_environment) { {} }
			let(:temp_dir) { Dir.mktmpdir }
			let(:cache_manifest) do
				<<~END
					CACHE MANIFEST
					# Generated by manifesto (http://github.com/johntopley/manifesto)
					# Hash: 3f0e1639df38c106683a41eb2a3572c7
					CACHE:
					/file2
					/file1
					/file0
					/dbConfig
					/appConfig
					# databaseName: test database name
					# appVersion: test app version

					NETWORK:
					/test/*
					/import
					/export
					/devices
				END
			end

			before :each do
				described_class.set :public_folder, temp_dir
				expect_any_instance_of(app).to receive(:database_name).and_return database_name
				expect_any_instance_of(app).to receive(:app_version).and_return app_version

				3.times do |i|
					File.open(File.join(temp_dir, "file#{i}"), 'w') do |f|
						f.write 'fake source'
					end
				end

				Dir.mkdir(File.join temp_dir, 'test')
				File.open(File.join(temp_dir, 'test', 'test_file'), 'w') do |f|
					f.write 'fake test'
				end
			end

			it_behaves_like 'a cache manifest', ' populated'

			after :each do
				FileUtils.remove_entry temp_dir
			end
		end
	end
end
