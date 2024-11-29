# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

# Programs controller
class ProgramsController < ApplicationController
	def index
		render json: ::Program.list
	end

	def show
		render json: ::Program.find(params[:id])
	end

	def create
		render json: ::Program.create!(program_params), status: :created
	end

	def update
		render json: ::Program.find(params[:id]).update!(program_params)
	end

	def destroy
		::Program.find(params[:id]).destroy!
		head :no_content
	end

	def count
		render json: ::Program.count
	end

	private

	def program_params
		params.expect program: [:name]
	end
end
