import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('mmdas', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.string('code').unique().notNullable();
    table.enum('type', ['metropolitan', 'municipal', 'district']).notNullable();
    table.string('region').notNullable();
    table.string('district_capital');
    table.text('address');
    table.string('phone');
    table.string('email');
    table.string('website');
    table.string('logo_url');
    table.string('banner_url');
    table.decimal('latitude', 10, 8);
    table.decimal('longitude', 11, 8);
    table.integer('population');
    table.decimal('area_km2', 10, 2);
    table.jsonb('contact_persons').defaultTo('[]');
    table.jsonb('bank_details').defaultTo('{}');
    table.jsonb('payment_gateways').defaultTo('{}');
    table.jsonb('tax_rates').defaultTo('{}');
    table.jsonb('settings').defaultTo('{}');
    table.enum('status', ['active', 'inactive', 'maintenance']).defaultTo('active');
    table.timestamp('activated_at');
    table.timestamps(true, true);
    
    // Indexes
    table.index(['code']);
    table.index(['type']);
    table.index(['region']);
    table.index(['status']);
    table.index(['created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('mmdas');
}
