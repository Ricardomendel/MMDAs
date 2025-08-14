import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('payments', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users').notNullable();
    table.integer('property_id').unsigned().references('id').inTable('properties');
    table.integer('revenue_category_id').unsigned().references('id').inTable('revenue_categories');
    table.decimal('amount', 15, 2).notNullable();
    table.enum('status', ['pending', 'completed', 'failed', 'cancelled']).defaultTo('pending');
    table.enum('payment_method', ['mobile_money', 'bank_transfer', 'cash', 'card']).notNullable();
    table.string('transaction_id').unique();
    table.text('description');
    table.date('due_date');
    table.date('paid_date');
    table.integer('mmda_id').unsigned().references('id').inTable('mmdas');
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('payments');
}
