import PrepareStatement from './PrepareStatement';
import InsertQueryBuilder from './builders/InsertQueryBuilder';
import UpdateQueryBuilder from './builders/UpdateQueryBuilder';
import DeleteQueryBuilder from './builders/DeleteQueryBuilder';
import SelectQueryBuilder from './builders/SelectQueryBuilder';
import mapOutputAst from './mapOutputAst';

import Schema from './Schema';
import Dictionary from './Dictionary';
import {
  Transaction,
  OutputAst,
  Aggregate,
  WhereAst,
  Query,
  SelectQueryArgs,
  AggregateQueryArgs,
  InsertQueryArgs,
  DeleteQueryArgs,
  UpdateQueryArgs,
} from './typings';
import DatabaseClient from './DatabaseClient';
import { QueryTypeEnum } from './enums';

export default class QueryRunner {
  schema: Schema;
  dictionary: Dictionary;
  client: Transaction | DatabaseClient;
  constructor(schema: Schema, dictionary: Dictionary, client: Transaction | DatabaseClient) {
    this.schema = schema;
    this.dictionary = dictionary;
    this.client = client;
  }

  run = async (query: Query) => {
    const { entity, type, args } = query;
    if (type === QueryTypeEnum.select) {
      const { ast, one = false } = args as SelectQueryArgs;
      return one ? this.#selectOne(entity, ast) : this.#select(entity, ast);
    }
    if (type === QueryTypeEnum.aggregate) {
      const { type: aggType, fieldOrOne, where = {} } = args as AggregateQueryArgs;
      return this.#aggregate(entity, aggType, fieldOrOne, where);
    }
    if (type === QueryTypeEnum.insert) {
      const { data } = args as InsertQueryArgs;
      return this.#insert(entity, data);
    }
    if (type === QueryTypeEnum.update) {
      const { where = {}, data } = args as UpdateQueryArgs;
      return this.#update(entity, data, where);
    }
    if (type === QueryTypeEnum.delete) {
      const { where } = args as DeleteQueryArgs;
      return this.#delete(entity, where);
    }
  };

  #select = async (entityName: string, ast: OutputAst) => {
    const selectAst = mapOutputAst(ast, entityName, this.schema);
    const preparedStatement = new PrepareStatement(this.schema);
    const preparedAst = preparedStatement.prepareSelect(selectAst);
    const qb = new SelectQueryBuilder(this.schema, this.dictionary);
    const query = qb.select(entityName, preparedAst);
    const result = await this.client.query(query, preparedStatement.values);
    return result.rows[0];
  };

  #selectOne = async (entityName: string, ast: OutputAst) => {
    const selectAst = mapOutputAst(ast, entityName, this.schema);
    const preparedStatement = new PrepareStatement(this.schema);
    const preparedAst = preparedStatement.prepareSelect(selectAst);
    const qb = new SelectQueryBuilder(this.schema, this.dictionary);
    const query = qb.selectOne(entityName, preparedAst);
    const result = await this.client.query(query, preparedStatement.values);
    return result.rows[0];
  };

  #aggregate = async (
    entityName: string,
    type: Aggregate,
    fieldOrOne: string | number,
    where: WhereAst = {}
  ) => {
    const preparedStatement = new PrepareStatement(this.schema);
    const preparedWhere = preparedStatement.prepareWhere(where);
    const qb = new SelectQueryBuilder(this.schema, this.dictionary);
    const query = qb.aggregate(entityName, type, fieldOrOne, preparedWhere);
    const result = await this.client.query(query, preparedStatement.values);
    return result.rows.length > 0 ? result.rows[0][type.toLowerCase()] : null;
  };

  #insert = async (entityName: string, data: Record<string, any>) => {
    const preparedStatement = new PrepareStatement(this.schema);
    const qb = new InsertQueryBuilder(this.schema, this.dictionary);
    const query = qb.insert(entityName, preparedStatement.prepareRecord(data, entityName));
    const result = await this.client.query(query, preparedStatement.values);
    return result.rowCount;
  };

  #update = async (entityName: string, data: Record<string, unknown>, where: WhereAst = {}) => {
    const preparedStatement = new PrepareStatement(this.schema);
    const qb = new UpdateQueryBuilder(this.schema, this.dictionary);
    const query = qb.update(
      entityName,
      preparedStatement.prepareRecord(data, entityName),
      preparedStatement.prepareWhere(where)
    );
    const result = await this.client.query(query, preparedStatement.values);
    return result.rowCount;
  };

  #delete = async (entityName: string, where: WhereAst = {}) => {
    const preparedStatement = new PrepareStatement(this.schema);
    const qb = new DeleteQueryBuilder(this.schema, this.dictionary);
    const query = qb.delete(entityName, preparedStatement.prepareWhere(where));
    const result = await this.client.query(query, preparedStatement.values);
    return result.rowCount;
  };
}
