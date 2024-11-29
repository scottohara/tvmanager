# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

# Episodes controller
class EpisodesController < ApplicationController
	def index
		render json: ::Episode.list(params[:series_id])
	end

	def show
		render json: ::Episode.find(params[:id])
	end

	def create
		render json: ::Episode.create!(episode_params), status: :created
	end

	def update
		render json: ::Episode.find(params[:id]).update!(episode_params)
	end

	def destroy
		::Episode.find(params[:id]).destroy!
		head :no_content
	end

	def count
		render json: ::Episode.count
	end

	def count_by_status
		render json: ::Episode.where(status: params[:status]).count
	end

	def unscheduled
		render json: ::Episode.unscheduled
	end

	private

	def episode_params
		params.expect episode: %i[name status status_date unverified unscheduled sequence series_id]
	end
end
