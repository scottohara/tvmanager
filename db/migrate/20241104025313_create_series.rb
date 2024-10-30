class CreateSeries < ActiveRecord::Migration[7.2]
  def change
    create_table :series do |t|
      t.string :name, null: false
      t.integer :now_showing
      t.references :program, null: false, foreign_key: true

      t.timestamps
    end
  end
end
