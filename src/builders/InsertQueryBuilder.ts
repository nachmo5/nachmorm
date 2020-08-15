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
        const column = this.$dictionary.getColumn(entityName, fieldName);
        return {
          ...acc,
          columns: [...acc.columns, `"${column}"`],
          values: [...acc.values, value],
        };
      },
      { columns: [], values: [] }
    );
}
