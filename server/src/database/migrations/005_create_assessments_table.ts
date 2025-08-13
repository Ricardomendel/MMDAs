import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('assessments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('taxpayer_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('mmda_id').references('id').inTable('mmdas').onDelete('CASCADE');
    table.uuid('revenue_category_id').references('id').inTable('revenue_categories').onDelete('CASCADE');
    table.uuid('property_id').references('id').inTable('properties').onDelete('CASCADE');
    table.string('assessment_number').unique().notNullable();
    table.enum('assessment_type', [
      'property_tax',
      'business_license',
      'market_fee',
      'building_permit',
      'waste_management',
      'parking_fee',
      'advertisement_fee',
      'development_levy',
      'other'
    ]).notNullable();
    table.decimal('assessed_amount', 15, 2).notNullable();
    table.decimal('tax_rate', 5, 2).notNullable();
    table.decimal('tax_amount', 15, 2).notNullable();
    table.decimal('penalty_amount', 15, 2).defaultTo(0.00);
    table.decimal('total_amount', 15, 2).notNullable();
    table.date('assessment_date').notNullable();
    table.date('due_date').notNullable();
    table.enum('status', [
      'pending',
      'approved',
      'rejected',
      'paid',
      'overdue',
      'cancelled',
      'disputed'
    ]).defaultTo('pending');
    table.text('description');
    table.text('remarks');
    table.jsonb('calculation_details').defaultTo('{}');
    table.jsonb('documents').defaultTo('[]');
    table.boolean('is_exempt').defaultTo(false);
    table.text('exemption_reason');
    table.uuid('assessed_by').references('id').inTable('users');
    table.timestamp('assessed_at');
    table.uuid('approved_by').references('id').inTable('users');
    table.timestamp('approved_at');
    table.uuid('rejected_by').references('id').inTable('users');
    table.timestamp('rejected_at');
    table.text('rejection_reason');
    table.jsonb('metadata').defaultTo('{}');
    table.timestamps(true, true);
    
    // Indexes
    table.index(['taxpayer_id']);
    table.index(['mmda_id']);
    table.index(['revenue_category_id']);
    table.index(['property_id']);
    table.index(['assessment_number']);
    table.index(['assessment_type']);
    table.index(['status']);
    table.index(['assessment_date']);
    table.index(['due_date']);
    table.index(['is_exempt']);
    table.index(['created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('assessments');
}
