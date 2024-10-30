# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

# Reports controller
class ReportsController < ApplicationController
	def incomplete
		render json: ::Series.incomplete
	end

	def status
		render json: ::Series.list_by_status(params[:status])
	end
end
