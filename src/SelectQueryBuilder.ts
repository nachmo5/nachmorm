import Dictionary from './Dictionary';
import Schema from './Schema';
import SelectAst, { SelectArguments } from './interfaces/SelectAst';
import Field from './interfaces/Field';

export default class SelectQueryBuilder {
  $schema: Schema;
  $dictionary: Dictionary;
  $counterMap: { [prefix: string]: number } = {};

  constructor(schema: Schema, dictionary: Dictionary) {
    this.$schema = schema;
    this.$dictionary = dictionary;
  }

  selectMany = (entityName: string, ast: SelectAst) => this.generateQuery(entityName, ast, true);

  generateQuery = (entityName: string, ast: SelectAst, list: boolean) => {
    const { name, fields = [], manyToOne = [], oneToMany = [], args = {} } = ast;
    // Base
    const baseAlias = this.getAlias('base');
    let query = this.generateBaseQuery(entityName, baseAlias);
    // Many to one
    manyToOne.forEach((mto) => {
      query = this.addJoinQuery(entityName, query, baseAlias, mto, false);
    });
    // One to many
    oneToMany.forEach((otm) => {
      query = this.addJoinQuery(entityName, query, baseAlias, otm, true);
    });
    // Arguments
    query = this.generateArgumentsWrapper(entityName, query, baseAlias, args);
    // output
    query = this.generateOutputWrapper(entityName, query, fields, manyToOne, oneToMany);
    // json
    query = this.generateJsonWrapper(query, name);
    // agg
    if (list) query = this.generateAggregateWrapper(query, name);
    return query;
  };

  generateBaseQuery = (entityName: string, alias: string) => {
    const tableName = this.$dictionary.getTable(entityName);
    return `SELECT * FROM ${tableName} AS ${alias}`;
  };

  addJoinQuery = (
    entityName: string,
    query: string,
    alias: string,
    relationAst: SelectAst,
    list: boolean
  ) => {
    const relation = list
      ? this.$schema.getOneToMany(entityName, relationAst.name)
      : this.$schema.getManyToOne(entityName, relationAst.name);
    if (!relation) {
      throw new Error(`Relation ${entityName}.${relationAst.name} not found in schema`);
    }
    const dbRelation = this.$dictionary.getRelation(entityName, relation.name);
    relationAst.args = relationAst.args || {};
    relationAst.args.on = [dbRelation.toColumn, `"${alias}"."${dbRelation.fromColumn}"`];
    const subQuery = this.generateQuery(relation.targetEntity, relationAst, list);
    return `${query} \nLEFT JOIN LATERAL (${subQuery}) AS ${this.getAlias('j')} ON true`;
  };

  generateArgumentsWrapper = (
    entityName: string,
    query: string,
    alias: string,
    args: SelectArguments
  ) => {
    const { where, offset, limit, orderBy, on } = args;
    let queryWithArgs = `${query} WHERE true`;
    if (on) queryWithArgs += ` AND "${alias}"."${on[0]}" = ${on[1]}`;
    return queryWithArgs;
  };

  generateOutputWrapper = (
    entityName: string,
    query: string,
    fields: string[],
    manyToOne: SelectAst[],
    oneToMany: SelectAst[]
  ) => {
    const alias = this.getAlias('base');
    const columns: string[] = fields.map(
      (fieldName) => `"${alias}"."${this.$dictionary.getColumn(entityName, fieldName)}"`
    );
    const joinColumns = [...manyToOne, ...oneToMany].map((mto) => `"${alias}"."${mto.name}"`);
    return `SELECT ${[...columns, ...joinColumns].join(', ')} FROM (${query}) as ${alias}`;
  };

  generateJsonWrapper = (query: string, alias: string) => {
    const queryAlias = this.getAlias('jsn');
    return `SELECT row_to_json(${queryAlias}) AS ${alias} FROM (${query}) AS ${queryAlias}`;
  };

  generateAggregateWrapper = (query: string, alias: string) => {
    const queryAlias = this.getAlias('agg');
    return `SELECT coalesce(json_agg("${alias}"), '[]') AS ${alias} FROM (${query}) AS ${queryAlias}`;
  };

  getAlias = (prefix: string) => {
    if (!this.$counterMap[prefix]) this.$counterMap[prefix] = 0;
    const alias = `${prefix}_${this.$counterMap[prefix]}`;
    this.$counterMap[prefix] = this.$counterMap[prefix] + 1;
    return alias;
  };
}
