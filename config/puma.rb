# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

threads_count = Integer(::ENV['MAX_THREADS'] || 3)
threads threads_count, threads_count

port ::ENV['PORT'] || 3000
