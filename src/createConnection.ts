import { Aggregate, WhereAst, OutputAst, Connection, Query } from './typings';
import DatabaseClient from './DatabaseClient';
import Schema from './Schema';
import Dictionary from './Dictionary';
import { QueryTypeEnum } from './enums';
import QueryRunner from './QueryRunner';
import { seqAsync } from './helpers';

export default (schema: Schema, dictionary: Dictionary, client: DatabaseClient): Connection => ({
  select: async (entityName: string, ast: OutputAst) => {
    const qr = new QueryRunner(schema, dictionary, client);
    const query: Query = {
      entity: entityName,
      args: { ast },
      type: QueryTypeEnum.select,
    };
    return qr.run(query);
  },

  selectOne: async (entityName: string, ast: OutputAst) => {
    const qr = new QueryRunner(schema, dictionary, client);
    const query: Query = {
      entity: entityName,
      args: { ast, one: true },
      type: QueryTypeEnum.select,
    };
    return qr.run(query);
  },

  aggregate: async (
    entityName: string,
    type: Aggregate,
    fieldOrOne: string | number,
    where: WhereAst = {}
  ) => {
    const qr = new QueryRunner(schema, dictionary, client);
    const query: Query = {
      entity: entityName,
      args: { where, fieldOrOne, type },
      type: QueryTypeEnum.aggregate,
    };
    return qr.run(query);
  },

  insert: async (entityName: string, data: Record<string, unknown>) => {
    const qr = new QueryRunner(schema, dictionary, client);
    const query: Query = {
      entity: entityName,
      args: { data },
      type: QueryTypeEnum.insert,
    };
    return qr.run(query);
  },

  update: async (entityName: string, data: Record<string, unknown>, where: WhereAst = {}) => {
    const qr = new QueryRunner(schema, dictionary, client);
    const query: Query = {
      entity: entityName,
      args: { data, where },
      type: QueryTypeEnum.update,
    };
    return qr.run(query);
  },

  delete: async (entityName: string, where: WhereAst = {}) => {
    const qr = new QueryRunner(schema, dictionary, client);
    const query: Query = {
      entity: entityName,
      args: { where },
      type: QueryTypeEnum.delete,
    };
    return qr.run(query);
  },

  transaction: async (queries: Query[]): Promise<any[]> => {
    if (queries.length === 0) return Promise.resolve([]);
    if (queries.length === 1) {
      const queryRunner = new QueryRunner(schema, dictionary, client);
      return queryRunner.run(queries[0]);
    }
    const transactionClient = await client.startTransaction();
    const queryRunner = new QueryRunner(schema, dictionary, transactionClient);

    await transactionClient.query('BEGIN');
    return seqAsync(queries, queryRunner.run)
      .then(async (result) => {
        await transactionClient.query('COMMIT');
        return result;
      })
      .catch(async (e) => {
        await transactionClient.query('ROLLBACK');

        return Promise.reject(e);
      })
      .finally(transactionClient.end);
  },

  raw: (query: string, values: any[] = []) => client.query(query, values),
});
