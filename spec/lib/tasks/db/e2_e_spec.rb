# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require 'rails_helper'
require 'tasks/db_e2e'

::RSpec.describe ::DB::E2E, type: :task do
	describe '::create_test_data' do
		before { allow(::ActiveRecord::Tasks::DatabaseTasks).to receive :truncate_all }

		it 'should define a new rake task' do
			described_class.create_test_data :example
			expect(::Rake::Task.task_defined? 'db:e2e:example').to be true
		end

		it 'should not define a rake task in non-local environments' do
			allow(::Rails.env).to receive(:local?).and_return false

			described_class.create_test_data :example

			expect(::Rake::Task.task_defined? 'db:e2e:example').to be false
		end

		it 'should connect to the test database and truncate any existing data' do
			described_class.create_test_data(:example) { nil }

			::Rake::Task['db:e2e:example'].invoke

			expect(::ActiveRecord::Base).to have_received(:establish_connection).with :test
			expect(::ActiveRecord::Tasks::DatabaseTasks).to have_received(:truncate_all).with 'test'
		end

		it 'should handle a block with no arguments' do
			expected = ''

			described_class.create_test_data :example do
				expected = nil
			end

			::Rake::Task['db:e2e:example'].invoke

			expect(expected).to be_nil
		end

		it 'should handle a block with one argument' do
			expected = nil

			described_class.create_test_data :example do |arg|
				expected = arg
			end

			::Rake::Task['db:e2e:example'].invoke 'arg1'

			expect(expected).to eq 'arg1'
		end

		it 'should handle a block with many arguments' do
			expected = nil

			described_class.create_test_data :example do |*args|
				expected = *args
			end

			::Rake::Task['db:e2e:example'].invoke 'arg1,arg2'

			expect(expected).to eq %w[arg1 arg2]
		end
	end
end
