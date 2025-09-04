exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.increments('id').primary();
    table.string('username').notNullable().unique();
    table.string('password').notNullable();
    table.integer('role_id').unsigned().references('id').inTable('roles');
    table.integer('company_id').unsigned().references('id').inTable('companies');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
