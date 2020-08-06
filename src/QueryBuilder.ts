import Dictionary from './Dictionary';
import Schema from './Schema';

export default class QueryBuilder {
  $schema: Schema;
  $dictionary: Dictionary;

  constructor(schema: Schema, dictionary: Dictionary) {
    this.$schema = schema;
    this.$dictionary = dictionary;
  }

  select = (entityName, ast, args) => {};
}
