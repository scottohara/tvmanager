# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

require 'rails_helper'

::RSpec.describe 'Programs' do
	describe 'GET /programs' do
		it 'should return a list of programs', :ok do
			programs = create_list(:program, 2)
			get(programs_path, headers:)
			expect(response.parsed_body.pluck 'id').to eq programs.map(&:id)
		end

		it 'should return an empty array if there are no programs', :ok do
			get(programs_path, headers:)
			expect(response.parsed_body).to eq []
		end
	end

	describe 'GET /programs/:id' do
		it 'should return a single program', :ok do
			program = create(:program)
			get(program_path(program), headers:)
			expect(response.parsed_body[:id]).to eq program.id
		end

		it 'should respond with a 404 Not Found status if the program is not found', :record_not_found do
			program = build(:program, id: 1)
			get(program_path(program), headers:)
		end
	end

	describe 'GET /programs/count' do
		it 'should return a count of programs', :ok do
			create_list(:program, 3)
			get(count_programs_path, headers:)
			expect(response.parsed_body).to eq 3
		end

		it 'should return zero if there are no programs', :ok do
			get(count_programs_path, headers:)
			expect(response.parsed_body).to eq 0
		end
	end

	describe 'POST /programs' do
		it 'should create a new program', :created do
			program = attributes_for(:program)
			post(programs_path, params: {program:}, headers:)
			expect(response.parsed_body[:name]).to eq program[:name]
		end

		it 'should respond with a 422 Unprocessable Content status if the program is invalid', :record_invalid do
			program = attributes_for(:program, name: nil)
			post(programs_path, params: {program:}, headers:)
		end
	end

	describe 'PUT /programs/:id' do
		it 'should update a program', :ok do
			program = create(:program)
			put(program_path(program), params: {program: program.attributes}, headers:)
			expect(response.parsed_body).to be true
		end

		it 'should respond with a 422 Unprocessable Content status if the program is invalid', :record_invalid do
			program = create(:program)
			program.name = nil
			put(program_path(program), params: {program: program.attributes}, headers:)
		end

		it 'should respond with a 404 Not Found status if the program is not found', :record_not_found do
			program = build(:program, id: 1)
			put(program_path(program), params: {program: program.attributes}, headers:)
		end
	end

	describe 'DELETE /programs/:id' do
		let(:accept_header) { nil }

		it 'should delete a program' do
			program = create(:program)
			delete(program_path(program), headers:)
			expect(response).to have_http_status :no_content
			expect(response.parsed_body).to be_empty
			get(program_path(program), headers:)
			expect(response).to have_http_status :not_found
		end

		it 'should respond with a 404 Not Found status if the program is not found', :record_not_found do
			program = build(:program, id: 1)
			delete(program_path(program), headers:)
		end
	end
end
