import { Client, ClientConfig, QueryResult } from 'pg';

export default class DatabaseClient {
  client: Client;
  constructor(config: ClientConfig) {
    this.client = new Client(config);
  }

  connect = () => this.client.connect();

  query = (text: string, values = []): Promise<QueryResult<any>> =>
    this.client.query(text.trim(), values);
}
