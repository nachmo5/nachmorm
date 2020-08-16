import Dictionary from '../Dictionary';
import Schema from '../Schema';
import { forEachObject } from '../helpers';
import { WhereAst } from '../typings';
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
      const field = this.$schema.getField(entityName, fieldName, false);
      if (field) {
        const column = this.$dictionary.getColumn(entityName, fieldName);
        return `"${column}" = ${value}`;
      }
      const manyToOne = this.$schema.getManyToOne(entityName, fieldName, false);
      if (manyToOne) {
        if (!value[manyToOne.targetField]) {
          throw new Error(
            `Invalid update data provided. field ${manyToOne.name}.${manyToOne.targetField} does not have a value`
          );
        }
        const relation = this.$dictionary.getRelation(entityName, manyToOne.name);
        return `"${relation.fromColumn}" = ${value[manyToOne.targetField]}`;
      }
      throw new Error(
        `Invalid update data provided. ${entityName}.${fieldName} is neither a field or a many to one`
      );
    });
    const whereStr = new WhereBuilder(this.$schema, this.$dictionary).build(entityName, where);
    return `UPDATE ${table} SET ${values.join(', ')} WHERE ${whereStr}`;
  };
}
