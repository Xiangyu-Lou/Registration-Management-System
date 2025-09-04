exports.up = function(knex) {
  return knex.schema.createTable('companies', function(table) {
    table.increments('id').primary();
    table.string('name').notNullable().unique();
    table.string('address');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('companies');
};
