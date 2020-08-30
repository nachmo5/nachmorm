import { WhereAst } from '../typings';
import Dictionary from '../Dictionary';
import Schema from '../Schema';
import WhereBuilder from './WhereBuilder';

export default class DeleteQueryBuilder {
  $schema: Schema;
  $dictionary: Dictionary;

  constructor(schema: Schema, dictionary: Dictionary) {
    this.$schema = schema;
    this.$dictionary = dictionary;
  }

  delete = (entityName: string, where: WhereAst = {}) => {
    const table = this.$dictionary.getTable(entityName);
    const whereStr = new WhereBuilder(this.$schema, this.$dictionary).build(entityName, where);
    return `DELETE FROM "${table}" WHERE ${whereStr}`;
  };
}
