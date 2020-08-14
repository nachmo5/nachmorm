import Dictionary from './Dictionary';
import Schema from './Schema';
import { forEachObject } from './helpers';
import WhereAst from './interfaces/WhereAst';
import WhereBuilder from './WhereBuilder';

export default class UpdateQueryBuilder {
  $schema: Schema;
  $dictionary: Dictionary;

  constructor(schema: Schema, dictionary: Dictionary) {
    this.$schema = schema;
    this.$dictionary = dictionary;
  }

  update = (entityName: string, ast: { [fieldName: string]: unknown }, where: WhereAst = {}) => {
    const table = this.$dictionary.getTable(entityName);
    const values = forEachObject(ast, (fieldName, value) => {
      const column = this.$dictionary.getColumn(entityName, fieldName);
      return `"${column}" = ${value}`;
    });
    const whereStr = new WhereBuilder(this.$schema, this.$dictionary).build(entityName, where);
    return `UPDATE ${table} SET ${values.join(', ')} WHERE ${whereStr}`;
  };
}
