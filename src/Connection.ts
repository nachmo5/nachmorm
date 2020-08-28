import { SelectAst, Aggregate, WhereAst, OutputAst } from './typings';
import DatabaseClient from './DatabaseClient';
import Schema from './Schema';
import Dictionary from './Dictionary';

import SelectQueryBuilder from './builders/SelectQueryBuilder';
import InsertQueryBuilder from './builders/InsertQueryBuilder';
import UpdateQueryBuilder from './builders/UpdateQueryBuilder';
import DeleteQueryBuilder from './builders/DeleteQueryBuilder';
import PrepareStatement from './PrepareStatement';

import mapOutputAst from './mapOutputAst';

export class Connection {
  $schema: Schema;
  $dictionary: Dictionary;
  $client: DatabaseClient;

  constructor(schema: Schema, dictionary: Dictionary, client: DatabaseClient) {
    this.$schema = schema;
    this.$dictionary = dictionary;
    this.$client = client;
  }

  select = async (entityName: string, ast: OutputAst) => {
    const selectAst = mapOutputAst(ast, entityName, this.$schema);
    const preparedStatement = new PrepareStatement();
    const preparedAst = preparedStatement.prepareSelect(selectAst);
    const qb = new SelectQueryBuilder(this.$schema, this.$dictionary);
    const query = qb.select(entityName, preparedAst);
    const result = await this.$client.query(query, preparedStatement.values);
    return result.rows[0];
  };

  selectOne = async (entityName: string, ast: OutputAst) => {
    const selectAst = mapOutputAst(ast, entityName, this.$schema);
    const preparedStatement = new PrepareStatement();
    const preparedAst = preparedStatement.prepareSelect(selectAst);
    const qb = new SelectQueryBuilder(this.$schema, this.$dictionary);
    const query = qb.selectOne(entityName, preparedAst);
    const result = await this.$client.query(query, preparedStatement.values);
    return result.rows[0];
  };

  aggregate = async (
    entityName: string,
    type: Aggregate,
    fieldOrOne: string | number,
    where: WhereAst = {}
  ) => {
    const preparedStatement = new PrepareStatement();
    const preparedWhere = preparedStatement.prepareWhere(where);
    const qb = new SelectQueryBuilder(this.$schema, this.$dictionary);
    const query = qb.aggregate(entityName, type.toLowerCase(), fieldOrOne, preparedWhere);
    const result = await this.$client.query(query, preparedStatement.values);
    return result.rows.length > 0 ? result.rows[0][type.toLowerCase()] : null;
  };

  insert = async (entityName: string, ast: Record<string, unknown>) => {
    const preparedStatement = new PrepareStatement();
    const qb = new InsertQueryBuilder(this.$schema, this.$dictionary);
    const query = qb.insert(entityName, preparedStatement.prepareRecord(ast));
    const result = await this.$client.query(query, preparedStatement.values);
    return result.rowCount;
  };

  update = async (entityName: string, ast: Record<string, unknown>, where: WhereAst = {}) => {
    const preparedStatement = new PrepareStatement();
    const qb = new UpdateQueryBuilder(this.$schema, this.$dictionary);
    const query = qb.update(
      entityName,
      preparedStatement.prepareRecord(ast),
      preparedStatement.prepareWhere(where)
    );
    const result = await this.$client.query(query, preparedStatement.values);
    return result.rowCount;
  };

  delete = async (entityName: string, where: WhereAst = {}) => {
    const preparedStatement = new PrepareStatement();
    const qb = new DeleteQueryBuilder(this.$schema, this.$dictionary);
    const query = qb.delete(entityName, preparedStatement.prepareWhere(where));
    const result = await this.$client.query(query, preparedStatement.values);
    return result.rowCount;
  };

  raw = (query: string, values: any[] = ([] = [])) => this.$client.query(query, values);
}
