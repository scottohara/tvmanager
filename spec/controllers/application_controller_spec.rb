require_relative '../spec_helper'
require_relative '../../app/controllers/application_controller'

describe TVManager::ApplicationController do
	def app
		described_class
	end

	describe "GET /" do
		it "should redirect to index.html" do
			get "/"
			follow_redirect!
			expect(last_request.url).to eql "http://example.org/index.html"
		end
	end

	describe "GET /dbConfig" do
		let(:database_name) { "test database name" }

		it "should return the database name in a JSON object" do
			stub_const "ENV", {"DATABASE_NAME" => database_name}
			get "/dbConfig"
			expect(last_response.content_type).to eql "application/json"
			expect(last_response.body).to eql({databaseName: database_name}.to_json)
		end
	end

	describe "GET /appConfig" do
		let(:app_version) { "test app version" }
		let(:max_data_age_days) { 1 }

		it "should return the app version and max data age days in a JSON object" do
			stub_const "ENV", {
				"APP_VERSION" => app_version,
				"TVMANAGER_MAX_DATA_AGE_DAYS" => max_data_age_days
			}
			get "/appConfig"
			expect(last_response.content_type).to eql "application/json"
			expect(last_response.body).to eql({appVersion: app_version, maxDataAgeDays: max_data_age_days}.to_json)
		end
	end
end
