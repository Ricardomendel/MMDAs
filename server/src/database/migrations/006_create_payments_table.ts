import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('payments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('taxpayer_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('assessment_id').references('id').inTable('assessments').onDelete('CASCADE');
    table.uuid('mmda_id').references('id').inTable('mmdas').onDelete('CASCADE');
    table.string('payment_reference').unique().notNullable();
    table.string('external_reference');
    table.enum('payment_method', [
      'mobile_money',
      'bank_transfer',
      'card_payment',
      'cash',
      'cheque',
      'bank_draft',
      'other'
    ]).notNullable();
    table.string('payment_provider'); // MTN, Vodafone, AirtelTigo, etc.
    table.decimal('amount', 15, 2).notNullable();
    table.decimal('fee', 10, 2).defaultTo(0.00);
    table.decimal('total_amount', 15, 2).notNullable();
    table.string('currency').defaultTo('GHS');
    table.enum('status', [
      'pending',
      'processing',
      'completed',
      'failed',
      'cancelled',
      'refunded',
      'disputed'
    ]).defaultTo('pending');
    table.text('description');
    table.text('failure_reason');
    table.jsonb('payment_details').defaultTo('{}');
    table.jsonb('receipt_data').defaultTo('{}');
    table.string('receipt_url');
    table.timestamp('paid_at');
    table.uuid('processed_by').references('id').inTable('users');
    table.timestamp('processed_at');
    table.jsonb('metadata').defaultTo('{}');
    table.timestamps(true, true);
    
    // Indexes
    table.index(['taxpayer_id']);
    table.index(['assessment_id']);
    table.index(['mmda_id']);
    table.index(['payment_reference']);
    table.index(['external_reference']);
    table.index(['payment_method']);
    table.index(['status']);
    table.index(['paid_at']);
    table.index(['created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('payments');
}
