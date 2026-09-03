class AddEpisodesStatusAndUnscheduledIndexes < ActiveRecord::Migration[8.1]
	def change
		add_index :episodes, :status
		add_index :episodes, :unscheduled, where: 'unscheduled', name: 'index_episodes_on_unscheduled_true'
	end
end
