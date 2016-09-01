# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true
require_relative '../spec_helper'
require_relative '../../app/helpers/environment'

describe 'TVManager::Helpers::Environment' do
	subject { Class.new.extend TVManager::Helpers::Environment }

	shared_context 'specified' do
		before :each do
			stub_const 'ENV', tvmanager_environment
		end
	end

	shared_context 'unspecified' do
		before :each do
			stub_const 'ENV', {}
		end
	end

	describe '#database_name' do
		let(:tvmanager_environment) { {'DATABASE_NAME' => name} }

		shared_examples 'the database name' do |type, present|
			it "should return the #{type} database name when the environment is #{present}present" do
				expect(subject.database_name).to eq(name)
			end
		end

		include_context 'specified' do
			let(:name) { 'From environment' }
			it_behaves_like 'the database name', 'specified'
		end

		include_context 'unspecified' do
			let(:name) { 'TVManager' }
			it_behaves_like 'the database name', 'default', 'not '
		end
	end

	describe '#app_version' do
		let(:tvmanager_environment) { {'APP_VERSION' => version} }

		shared_examples 'the app version' do |type, present|
			it "should return the #{type} app version when the environment is #{present}present" do
				expect(subject.app_version).to eq version
			end
		end

		include_context 'specified' do
			let(:version) { 'From environment' }
			it_behaves_like 'the app version', 'specified'
		end

		include_context 'unspecified' do
			let(:version) { `git describe`.chomp }
			it_behaves_like 'the app version', 'default', 'not '
		end
	end

	describe '#max_data_age_days' do
		let(:tvmanager_environment) { {'TVMANAGER_MAX_DATA_AGE_DAYS' => days} }

		shared_examples 'the max data age days' do |type, present|
			it "should return the #{type} max data age days when the environment is #{present}present" do
				expect(subject.max_data_age_days).to eq days
			end
		end

		include_context 'specified' do
			let(:days) { 'From environment' }
			it_behaves_like 'the max data age days', 'specified'
		end

		include_context 'unspecified' do
			let(:days) { 7 }
			it_behaves_like 'the max data age days', 'default', 'not '
		end
	end
end
