import { Entity, Config, SelectAst, Aggregate, WhereAst, DatabaseOrm } from './typings';
import DatabaseClient from './DatabaseClient';
import Schema from './Schema';
import Dictionary from './Dictionary';
import Synchronizer from './Synchronizer';
import SelectQueryBuilder from './builders/SelectQueryBuilder';
import InsertQueryBuilder from './builders/InsertQueryBuilder';
import UpdateQueryBuilder from './builders/UpdateQueryBuilder';
import DeleteQueryBuilder from './builders/DeleteQueryBuilder';

export default class Nachmorm implements DatabaseOrm {
  $schema: Schema;
  $dictionary: Dictionary;
  $client: DatabaseClient;

  constructor(config: Config, entities: Entity[] = []) {
    this.$schema = new Schema(entities);
    this.$dictionary = new Dictionary(entities);
    this.$client = new DatabaseClient(config);
  }

  connect = async (synchronize: boolean = true) => {
    await this.$client.connect();
    if (synchronize) {
      await new Synchronizer(this.$schema, this.$dictionary, this.$client).synchronize();
    }
    return this;
  };

  select = async (entityName: string, ast: SelectAst, values: any[] = []) => {
    const qb = new SelectQueryBuilder(this.$schema, this.$dictionary);
    const query = qb.select(entityName, ast);
    const result = await this.$client.query(query, values);
    return result.rows;
  };

  selectOne = async (entityName: string, ast: SelectAst, values: any[] = []) => {
    const qb = new SelectQueryBuilder(this.$schema, this.$dictionary);
    const query = qb.selectOne(entityName, ast);
    const result = await this.$client.query(query, values);
    return result.rows.length > 0 ? result.rows[0] : null;
  };

  aggregate = async (
    entityName: string,
    type: Aggregate,
    fieldOrOne: string | number,
    where: WhereAst = {},
    values: any[] = []
  ) => {
    const qb = new SelectQueryBuilder(this.$schema, this.$dictionary);
    const query = qb.aggregate(entityName, type.toLowerCase(), fieldOrOne, where);
    const result = await this.$client.query(query, values);
    return result.rows.length > 0 ? result.rows[0][type.toLowerCase()] : null;
  };

  insert = async (
    entityName: string,
    ast: { [fieldName: string]: unknown },
    values: any[] = []
  ) => {
    const qb = new InsertQueryBuilder(this.$schema, this.$dictionary);
    const query = qb.insert(entityName, ast);
    const result = await this.$client.query(query, values);
    return result.rowCount;
  };

  update = async (
    entityName: string,
    ast: { [fieldName: string]: unknown },
    where: WhereAst = {},
    values: any[] = []
  ) => {
    const qb = new UpdateQueryBuilder(this.$schema, this.$dictionary);
    const query = qb.update(entityName, ast, where);
    const result = await this.$client.query(query, values);
    return result.rowCount;
  };

  delete = async (entityName: string, where: WhereAst = {}, values: any[] = []) => {
    const qb = new DeleteQueryBuilder(this.$schema, this.$dictionary);
    const query = qb.delete(entityName, where);
    const result = await this.$client.query(query, values);
    return result.rowCount;
  };

  raw = (query: string, values: any[] = ([] = [])) => this.$client.query(query, values);
}
