# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

# Episodes controller
class EpisodesController < ApplicationController
	def index
		render json: ::Episode.list(params.expect :series_id)
	end

	def show
		render json: ::Episode.find(params.expect :id)
	end

	def create
		render json: ::Series.find(params.expect(:series_id)).episodes.create!(episode_params), status: :created
	end

	def update
		render json: ::Episode.find(params.expect(:id)).update!(episode_params)
	end

	def destroy
		::Episode.find(params.expect(:id)).destroy!
		head :no_content
	end

	def resequence
		::Episode.resequence params.expect(:series_id), params.expect(episode_ids: [])
		head :no_content
	end

	def count
		render json: ::Episode.count
	end

	def count_by_status
		render json: ::Episode.where(status: params.expect(:status)).count
	end

	def unscheduled
		render json: ::Episode.unscheduled
	end

	private

	def episode_params
		params.expect episode: %i[name status status_date unverified unscheduled sequence]
	end
end
