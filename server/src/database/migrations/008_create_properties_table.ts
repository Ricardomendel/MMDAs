import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('properties', (table) => {
    table.increments('id').primary();
    table.string('property_id').notNullable().unique();
    table.string('address').notNullable();
    table.string('owner_name').notNullable();
    table.string('owner_email');
    table.string('owner_phone');
    table.decimal('property_value', 15, 2);
    table.enum('status', ['active', 'inactive', 'pending']).defaultTo('pending');
    table.integer('mmda_id').unsigned().references('id').inTable('mmdas');
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('properties');
}
