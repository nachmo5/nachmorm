import { Pool, PoolClient, QueryResult } from 'pg';
import { Config } from './typings';
import { now } from './helpers';

export default class DatabaseClient {
  pool: Pool;
  config: Config;
  constructor(config: Config) {
    this.pool = new Pool(config.connection);
    this.config = config;
  }

  query = async (text: string, values: any[] = []): Promise<QueryResult<any>> =>
    this.clientQuery(text, values, this.pool);

  startTransaction = async () => {
    const transactionId = Date.now();
    if (this.config.logging) console.log(`Started transaction number ${transactionId}`);
    const client = await this.pool.connect();
    return {
      query: (text: string, values: any[] = []) => this.clientQuery(text, values, this.pool),
      end: () => {
        if (this.config.logging) console.log(`Finished transaction number ${transactionId}`);
        client.release();
      },
    };
  };

  clientQuery = async (text: string, values: any[] = [], client: Pool | PoolClient) => {
    if (this.config.logging) {
      console.log(`${now()}: ${text}; [${values.join(', ')}]`);
    }
    const start = Date.now();
    const result = await client.query(text, values || []);
    const end = Date.now();
    if (this.config.logging) {
      console.log(`===> Query Execution time ${end - start}ms`);
    }
    return result;
  };
}
