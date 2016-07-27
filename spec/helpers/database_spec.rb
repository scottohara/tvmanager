require_relative '../spec_helper'
require_relative '../../app/helpers/database'

describe "TVManager::Helpers::Database" do
	subject { Class.new.extend TVManager::Helpers::Database }

	describe "#db" do
		it "should return a connection to the database" do
			subject.disconnect!
			expect(CouchRest).to receive(:database!).with("#{ENV[:TVMANAGER_COUCHDB_URL.to_s]}_test").and_call_original.once
			expect(subject.db).to be_a CouchRest::Database
			expect(subject.db.to_s).to eql subject.database_url
		end
	end

	describe "#database_url" do
		it "should raise a 500 Internal Server Error when the database URL environment variable is not set" do
			stub_const "ENV", {}
			expect{subject.database_url}.to raise_error InternalServerError, "TVMANAGER_COUCHDB_URL environment variable is not configured"
		end

		let(:url) { "fake database url" }

		it "should return the configured database URL when not in the :test environment" do
			stub_const "ENV", {
				"TVMANAGER_COUCHDB_URL" => url,
				"RACK_ENV" => "non-test environment"
			}
			expect(subject.database_url).to eql url
		end

		it "should return the configured database URL suffixed with _test when in the :test environment" do
			expect(subject.database_url).to eql "#{ENV[:TVMANAGER_COUCHDB_URL.to_s]}_test"
		end
	end

	describe "#disconnect" do
		it "should set the database connection to nil" do
			expect(CouchRest).to receive(:database!).with("#{ENV[:TVMANAGER_COUCHDB_URL.to_s]}_test").and_call_original.twice
			subject.disconnect!
			subject.db	# new connection
			subject.db	# cached connection
			subject.disconnect!
			subject.db  # new connection
			subject.db  # cached connection
		end
	end
end
