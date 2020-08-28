import { Entity, Config, SelectAst, Aggregate, WhereAst, OutputAst, DatabaseOrm } from './typings';
import DatabaseClient from './DatabaseClient';
import PrepareStatement from './PrepareStatement';
import Schema from './Schema';
import Dictionary from './Dictionary';
import Synchronizer from './Synchronizer';
import SelectQueryBuilder from './builders/SelectQueryBuilder';
import InsertQueryBuilder from './builders/InsertQueryBuilder';
import UpdateQueryBuilder from './builders/UpdateQueryBuilder';
import DeleteQueryBuilder from './builders/DeleteQueryBuilder';
import mapOutputAst from './mapOutputAst';

export default class Nachmorm implements DatabaseOrm {
  $schema: Schema;
  $dictionary: Dictionary;
  $client: DatabaseClient;
  connected: boolean = false;

  constructor(config: Config, entities: Entity[] = [], names?: Record<string, string>) {
    this.$schema = new Schema(entities);
    this.$dictionary = new Dictionary(entities, names);
    this.$client = new DatabaseClient(config);
  }

  connect = async (synchronize: boolean = true) => {
    await this.$client.connect();
    if (synchronize) {
      await new Synchronizer(this.$schema, this.$dictionary, this.$client).synchronize();
    }
    this.connected = true;
    return this;
  };

  select = async (entityName: string, ast: OutputAst) => {
    if (!this.connected) {
      throw new Error('Database not connected');
    }
    const selectAst: SelectAst = mapOutputAst(ast, entityName, this.$schema);
    const preparedStatement = new PrepareStatement();
    const preparedAst = preparedStatement.prepareSelect(selectAst);
    const qb = new SelectQueryBuilder(this.$schema, this.$dictionary);
    const query = qb.select(entityName, preparedAst);
    const result = await this.$client.query(query, preparedStatement.values);
    return result.rows[0];
  };

  selectOne = async (entityName: string, ast: OutputAst) => {
    if (!this.connected) {
      throw new Error('Database not connected');
    }
    const selectAst: SelectAst = mapOutputAst(ast, entityName, this.$schema);
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
    if (!this.connected) {
      throw new Error('Database not connected');
    }
    const preparedStatement = new PrepareStatement();
    const preparedWhere = preparedStatement.prepareWhere(where);
    const qb = new SelectQueryBuilder(this.$schema, this.$dictionary);
    const query = qb.aggregate(entityName, type.toLowerCase(), fieldOrOne, preparedWhere);
    const result = await this.$client.query(query, preparedStatement.values);
    return result.rows.length > 0 ? result.rows[0][type.toLowerCase()] : null;
  };

  insert = async (entityName: string, data: Record<string, unknown>): Promise<number> => {
    if (!this.connected) {
      throw new Error('Database not connected');
    }
    const preparedStatement = new PrepareStatement();
    const qb = new InsertQueryBuilder(this.$schema, this.$dictionary);
    const query = qb.insert(entityName, preparedStatement.prepareRecord(data));
    const result = await this.$client.query(query, preparedStatement.values);
    return result.rowCount;
  };

  update = async (
    entityName: string,
    data: Record<string, unknown>,
    where: WhereAst
  ): Promise<number> => {
    if (!this.connected) {
      throw new Error('Database not connected');
    }
    const preparedStatement = new PrepareStatement();
    const qb = new UpdateQueryBuilder(this.$schema, this.$dictionary);
    const query = qb.update(
      entityName,
      preparedStatement.prepareRecord(data),
      preparedStatement.prepareWhere(where)
    );
    const result = await this.$client.query(query, preparedStatement.values);
    return result.rowCount;
  };

  delete = async (entityName: string, where: WhereAst = {}) => {
    if (!this.connected) {
      throw new Error('Database not connected');
    }
    const preparedStatement = new PrepareStatement();
    const qb = new DeleteQueryBuilder(this.$schema, this.$dictionary);
    const query = qb.delete(entityName, preparedStatement.prepareWhere(where));
    const result = await this.$client.query(query, preparedStatement.values);
    return result.rowCount;
  };

  raw = (query: string, values: any[] = ([] = [])) => this.$client.query(query, values);
}
