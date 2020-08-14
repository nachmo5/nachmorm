import { ClientConfig } from 'pg';

export interface Config {
  connection: ClientConfig;
  logging?: boolean;
}
