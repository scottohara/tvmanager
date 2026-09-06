# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

# Series controller
class SeriesController < ApplicationController
	def index
		render json: ::Series.list(params[:program_id])
	end

	def show
		render json: ::Series.find(params[:id])
	end

	def create
		render json: ::Program.find(params[:program_id]).series.create!(series_params), status: :created
	end

	def update
		render json: ::Series.find(params[:id]).update!(series_params :program_id)
	end

	def destroy
		::Series.find(params[:id]).destroy!
		head :no_content
	end

	def count
		render json: ::Series.count
	end

	def scheduled
		render json: ::Series.scheduled
	end

	private

	def series_params(*additional)
		params.expect series: [:name, :now_showing, *additional]
	end
end
