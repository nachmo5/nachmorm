import { Client, QueryResult } from 'pg';
import { Config } from './interfaces/Config';

export default class DatabaseClient {
  client: Client;
  config: Config;
  constructor(config: Config) {
    this.client = new Client(config.connection);
    this.config = config;
  }

  connect = () => this.client.connect();

  query = async (text: string, values: any[] = []): Promise<QueryResult<any>> => {
    if (this.config.logging) {
      console.log(`[${Date.now()}]`, ': ', text);
    }
    const start = Date.now();
    const result = await this.client.query(text, values || []);
    const end = Date.now();
    if (this.config.logging) {
      console.log(`===> Query Execution time ${end - start}ms`);
    }
    return result;
  };
}
