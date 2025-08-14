import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('revenue_categories', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable().unique();
    table.text('description').notNullable();
    table.decimal('rate', 10, 2).notNullable();
    table.enum('status', ['active', 'inactive']).defaultTo('active');
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('revenue_categories');
}
