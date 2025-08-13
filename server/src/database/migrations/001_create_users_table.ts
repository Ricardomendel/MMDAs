import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email').unique().notNullable();
    table.string('phone').unique();
    table.string('password_hash').notNullable();
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    table.string('middle_name');
    table.enum('role', ['admin', 'staff', 'taxpayer', 'super_admin']).defaultTo('taxpayer');
    table.enum('status', ['active', 'inactive', 'suspended', 'pending']).defaultTo('pending');
    table.string('ghana_card_number').unique();
    table.string('passport_number').unique();
    table.date('date_of_birth');
    table.enum('gender', ['male', 'female', 'other']);
    table.text('address');
    table.string('city');
    table.string('region');
    table.string('postal_code');
    table.string('emergency_contact_name');
    table.string('emergency_contact_phone');
    table.string('profile_image_url');
    table.boolean('email_verified').defaultTo(false);
    table.boolean('phone_verified').defaultTo(false);
    table.timestamp('email_verified_at');
    table.timestamp('phone_verified_at');
    table.timestamp('last_login_at');
    table.string('last_login_ip');
    table.integer('login_attempts').defaultTo(0);
    table.timestamp('locked_until');
    table.jsonb('preferences').defaultTo('{}');
    table.jsonb('metadata').defaultTo('{}');
    table.timestamps(true, true);
    
    // Indexes
    table.index(['email']);
    table.index(['phone']);
    table.index(['role']);
    table.index(['status']);
    table.index(['ghana_card_number']);
    table.index(['created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('users');
}
