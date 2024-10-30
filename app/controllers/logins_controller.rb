# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

# Logins controller
class LoginsController < ApplicationController
	def create
		head :created
	end
end
