import { Entity, Config } from './typings';
import DatabaseClient from './DatabaseClient';
import Schema from './Schema';
import Dictionary from './Dictionary';
import Synchronizer from './Synchronizer';
import Connection from './Connection';

export default class Nachmorm {
  $schema: Schema;
  $dictionary: Dictionary;
  $client: DatabaseClient;

  constructor(config: Config, entities: Entity[] = []) {
    this.$schema = new Schema(entities);
    this.$dictionary = new Dictionary(entities);
    this.$client = new DatabaseClient(config);
  }

  connect = async (synchronize: boolean = true): Promise<Connection> => {
    await this.$client.connect();
    if (synchronize) {
      await new Synchronizer(
        this.$schema,
        this.$dictionary,
        this.$client
      ).synchronize();
    }
    return new Connection(this.$schema, this.$dictionary, this.$client);
  };
}
