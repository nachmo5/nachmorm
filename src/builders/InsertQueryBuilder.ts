import Dictionary from '../Dictionary';
import Schema from '../Schema';
import { reduceObject } from '../helpers';

export default class InsertQueryBuilder {
  $schema: Schema;
  $dictionary: Dictionary;

  constructor(schema: Schema, dictionary: Dictionary) {
    this.$schema = schema;
    this.$dictionary = dictionary;
  }

  insert = (entityName: string, ast: { [fieldName: string]: unknown }) => {
    const table = this.$dictionary.getTable(entityName);
    const { columns, values } = this.mapAst(entityName, ast);
    return `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')})`;
  };

  insertMany = (entityName: string, ast: { [fieldName: string]: unknown }[]) => {
    if (ast.length === 0) return '';
    const table = this.$dictionary.getTable(entityName);
    const rows = ast.map((el) => this.mapAst(entityName, el));
    const { columns } = rows[0];

    const batchValues = rows.map(({ values }) => `(${values.join(', ')})`);
    return `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${batchValues.join(',')}`;
  };

  mapAst = (entityName: string, ast: { [fieldName: string]: unknown }) =>
    reduceObject(
      ast,
      (acc, fieldName, value) => {
        const field = this.$schema.getField(entityName, fieldName, false);
        if (field) {
          const column = this.$dictionary.getColumn(entityName, field.name);
          return {
            ...acc,
            columns: [...acc.columns, `"${column}"`],
            values: [...acc.values, value],
          };
        }
        const manyToOne = this.$schema.getManyToOne(entityName, fieldName, false);
        if (manyToOne) {
          if (!value[manyToOne.targetField]) {
            throw new Error(
              `Invalid insert data provided. field ${manyToOne.name}.${manyToOne.targetField} does not have a value`
            );
          }
          const relation = this.$dictionary.getRelation(entityName, manyToOne.name);
          return {
            ...acc,
            columns: [...acc.columns, `"${relation.fromColumn}"`],
            values: [...acc.values, value[manyToOne.targetField]],
          };
        }
        throw new Error(
          `Invalid insert data provided. ${entityName}.${fieldName} is neither a field or a many to one`
        );
      },
      { columns: [], values: [] }
    );
}
