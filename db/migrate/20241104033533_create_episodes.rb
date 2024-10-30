class CreateEpisodes < ActiveRecord::Migration[7.2]
  def change
		create_enum :status, ['watched', 'recorded', 'expected', 'missed']

    create_table :episodes do |t|
      t.string :name, null: false
      t.enum :status, enum_type: 'status'
      t.date :status_date
      t.boolean :unverified, default: false, null: false
      t.boolean :unscheduled, default: false, null: false
      t.integer :sequence, null: false
      t.references :series, null: false, foreign_key: true

      t.timestamps
    end
  end
end
