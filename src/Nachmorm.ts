import { Entity, Config, Connection } from './typings';
import DatabaseClient from './DatabaseClient';
import Schema from './Schema';
import Dictionary from './Dictionary';
import Synchronizer from './Synchronizer';
import createConnection from './createConnection';

export default class Nachmorm {
  #schema: Schema;
  #dictionary: Dictionary;
  #client: DatabaseClient;

  constructor(config: Config, entities: Entity[] = []) {
    this.#schema = new Schema(entities);
    this.#dictionary = new Dictionary(entities);
    this.#client = new DatabaseClient(config);
  }

  connect = async (synchronize: boolean = true): Promise<Connection> => {
    if (synchronize) {
      try {
        await new Synchronizer(this.#schema, this.#dictionary, this.#client).synchronize();
      } catch (e) {
        console.log('Database Synchronization Error');
        throw e;
      }
    }
    return createConnection(this.#schema, this.#dictionary, this.#client);
  };
}
