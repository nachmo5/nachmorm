import { Aggregate, WhereAst, OutputAst, Connection } from './typings';
import DatabaseClient from './DatabaseClient';
import Schema from './Schema';
import Dictionary from './Dictionary';

import SelectQueryBuilder from './builders/SelectQueryBuilder';
import InsertQueryBuilder from './builders/InsertQueryBuilder';
import UpdateQueryBuilder from './builders/UpdateQueryBuilder';
import DeleteQueryBuilder from './builders/DeleteQueryBuilder';
import PrepareStatement from './PrepareStatement';

import mapOutputAst from './mapOutputAst';

export default (schema: Schema, dictionary: Dictionary, client: DatabaseClient): Connection => ({
  select: async (entityName: string, ast: OutputAst) => {
    const selectAst = mapOutputAst(ast, entityName, schema);
    const preparedStatement = new PrepareStatement(schema);
    const preparedAst = preparedStatement.prepareSelect(selectAst);
    const qb = new SelectQueryBuilder(schema, dictionary);
    const query = qb.select(entityName, preparedAst);
    const result = await client.query(query, preparedStatement.values);
    return result.rows[0];
  },

  selectOne: async (entityName: string, ast: OutputAst) => {
    const selectAst = mapOutputAst(ast, entityName, schema);
    const preparedStatement = new PrepareStatement(schema);
    const preparedAst = preparedStatement.prepareSelect(selectAst);
    const qb = new SelectQueryBuilder(schema, dictionary);
    const query = qb.selectOne(entityName, preparedAst);
    const result = await client.query(query, preparedStatement.values);
    return result.rows[0];
  },

  aggregate: async (
    entityName: string,
    type: Aggregate,
    fieldOrOne: string | number,
    where: WhereAst = {}
  ) => {
    const preparedStatement = new PrepareStatement(schema);
    const preparedWhere = preparedStatement.prepareWhere(where);
    const qb = new SelectQueryBuilder(schema, dictionary);
    const query = qb.aggregate(entityName, type, fieldOrOne, preparedWhere);
    const result = await client.query(query, preparedStatement.values);
    return result.rows.length > 0 ? result.rows[0][type.toLowerCase()] : null;
  },

  insert: async (entityName: string, ast: Record<string, unknown>) => {
    const preparedStatement = new PrepareStatement(schema);
    const qb = new InsertQueryBuilder(schema, dictionary);
    const query = qb.insert(entityName, preparedStatement.prepareRecord(ast, entityName));
    const result = await client.query(query, preparedStatement.values);
    return result.rowCount;
  },

  update: async (entityName: string, ast: Record<string, unknown>, where: WhereAst = {}) => {
    const preparedStatement = new PrepareStatement(schema);
    const qb = new UpdateQueryBuilder(schema, dictionary);
    const query = qb.update(
      entityName,
      preparedStatement.prepareRecord(ast, entityName),
      preparedStatement.prepareWhere(where)
    );
    const result = await client.query(query, preparedStatement.values);
    return result.rowCount;
  },

  delete: async (entityName: string, where: WhereAst = {}) => {
    const preparedStatement = new PrepareStatement(schema);
    const qb = new DeleteQueryBuilder(schema, dictionary);
    const query = qb.delete(entityName, preparedStatement.prepareWhere(where));
    const result = await client.query(query, preparedStatement.values);
    return result.rowCount;
  },

  raw: (query: string, values: any[] = []) => client.query(query, values),
});
