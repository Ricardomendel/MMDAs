import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('revenue_categories', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('mmda_id').references('id').inTable('mmdas').onDelete('CASCADE');
    table.string('name').notNullable();
    table.string('code').notNullable();
    table.text('description');
    table.enum('type', [
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
    table.decimal('base_rate', 10, 2).notNullable();
    table.string('rate_type').defaultTo('percentage'); // percentage, fixed, tiered
    table.jsonb('rate_structure').defaultTo('{}');
    table.string('calculation_method').defaultTo('simple'); // simple, tiered, progressive
    table.boolean('is_active').defaultTo(true);
    table.boolean('requires_approval').defaultTo(false);
    table.boolean('has_penalty').defaultTo(false);
    table.integer('penalty_days').defaultTo(30);
    table.decimal('penalty_rate', 5, 2).defaultTo(0.00);
    table.jsonb('requirements').defaultTo('[]');
    table.jsonb('documents_required').defaultTo('[]');
    table.integer('validity_period_days');
    table.string('frequency').defaultTo('annual'); // daily, weekly, monthly, quarterly, annual
    table.jsonb('exemptions').defaultTo('[]');
    table.jsonb('metadata').defaultTo('{}');
    table.timestamps(true, true);
    
    // Indexes
    table.index(['mmda_id']);
    table.index(['code']);
    table.index(['type']);
    table.index(['is_active']);
    table.index(['created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('revenue_categories');
}
