import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('properties', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('owner_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('mmda_id').references('id').inTable('mmdas').onDelete('CASCADE');
    table.string('property_number').unique().notNullable();
    table.string('title_deed_number');
    table.string('street_address').notNullable();
    table.string('city').notNullable();
    table.string('region').notNullable();
    table.string('postal_code');
    table.decimal('latitude', 10, 8);
    table.decimal('longitude', 11, 8);
    table.enum('property_type', [
      'residential',
      'commercial',
      'industrial',
      'agricultural',
      'mixed_use',
      'vacant_land',
      'government',
      'religious',
      'educational',
      'other'
    ]).notNullable();
    table.enum('property_status', [
      'occupied',
      'vacant',
      'under_construction',
      'demolished',
      'exempt'
    ]).defaultTo('occupied');
    table.decimal('land_area_sqm', 10, 2);
    table.decimal('building_area_sqm', 10, 2);
    table.integer('number_of_floors').defaultTo(1);
    table.integer('number_of_rooms');
    table.integer('year_built');
    table.string('construction_material');
    table.enum('roof_type', ['concrete', 'zinc', 'aluminum', 'tile', 'thatch', 'other']);
    table.enum('wall_type', ['concrete', 'brick', 'wood', 'mud', 'other']);
    table.decimal('rateable_value', 15, 2);
    table.decimal('assessed_value', 15, 2);
    table.decimal('market_value', 15, 2);
    table.jsonb('amenities').defaultTo('[]');
    table.jsonb('images').defaultTo('[]');
    table.jsonb('documents').defaultTo('[]');
    table.boolean('is_exempt').defaultTo(false);
    table.text('exemption_reason');
    table.date('exemption_start_date');
    table.date('exemption_end_date');
    table.boolean('is_verified').defaultTo(false);
    table.timestamp('verified_at');
    table.uuid('verified_by').references('id').inTable('users');
    table.jsonb('metadata').defaultTo('{}');
    table.timestamps(true, true);
    
    // Indexes
    table.index(['owner_id']);
    table.index(['mmda_id']);
    table.index(['property_number']);
    table.index(['title_deed_number']);
    table.index(['property_type']);
    table.index(['property_status']);
    table.index(['city']);
    table.index(['region']);
    table.index(['is_exempt']);
    table.index(['is_verified']);
    table.index(['created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('properties');
}
