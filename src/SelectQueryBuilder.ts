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

  selectMany = (entityName: string, ast: SelectAst) =>
    this.generateQuery(entityName, ast, true);

  generateQuery = (entityName: string, ast: SelectAst, list: boolean) => {
    const { name, manyToOne = [], oneToMany = [], args = {} } = ast;
    /* ================ LOGIC ============== */
    const rootBaseAlias = this.getAlias('root.base');
    let query = this.generateBaseQuery(entityName, rootBaseAlias);
    // Joins: Many to one
    manyToOne.forEach((mto) => {
      query = this.addJoinQuery(entityName, query, rootBaseAlias, mto, false);
    });
    // Joins: One to many
    oneToMany.forEach((otm) => {
      query = this.addJoinQuery(entityName, query, rootBaseAlias, otm, true);
    });
    // Arguments
    query = this.generateArgumentsWrapper(
      entityName,
      query,
      rootBaseAlias,
      args
    );
    /* ================ FORMATTING ============== */
    const baseAlias = this.getAlias('base');
    // Output
    const outputQuery = this.generateOutputQuery(entityName, baseAlias, ast);
    // json
    query = this.generateJsonWrapper(outputQuery, query, baseAlias, name);
    // agg
    if (list) query = this.generateAggregateWrapper(query, name);
    return query;
  };

  generateBaseQuery = (entityName: string, alias: string) => {
    const tableName = this.$dictionary.getTable(entityName);
    return `SELECT * FROM ${tableName} AS "${alias}"`;
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
      throw new Error(
        `Relation ${entityName}.${relationAst.name} not found in schema`
      );
    }
    const dbRelation = this.$dictionary.getRelation(entityName, relation.name);
    relationAst.args = relationAst.args || {};
    relationAst.args.on = [
      dbRelation.toColumn,
      `"${alias}"."${dbRelation.fromColumn}"`,
    ];
    const subQuery = this.generateQuery(
      relation.targetEntity,
      relationAst,
      list
    );
    return `${query} \nLEFT JOIN LATERAL (${subQuery}) AS ${this.getAlias(
      'j'
    )} ON true`;
  };

  generateArgumentsWrapper = (
    entityName: string,
    query: string,
    alias: string,
    args: SelectArguments
  ) => {
    const { where, offset, limit, on } = args;
    let queryWithArgs = `${query} WHERE true`;
    if (on) queryWithArgs += ` AND "${alias}"."${on[0]}" = ${on[1]}`;
    return queryWithArgs;
  };

  generateOutputQuery = (
    entityName: string,
    baseAlias: string,
    ast: SelectAst
  ) => {
    const { fields = [], manyToOne = [], oneToMany = [] } = ast;
    const outputAlias = this.getAlias('o');
    const columns: string[] = fields.map(
      (fieldName) =>
        `"${baseAlias}"."${this.$dictionary.getColumn(entityName, fieldName)}"`
    );
    const joinColumns = [...manyToOne, ...oneToMany].map(
      (rel) => `"${baseAlias}"."${rel.name}"`
    );
    return `SELECT ${outputAlias} FROM (SELECT ${[
      ...columns,
      ...joinColumns,
    ].join(', ')}) AS ${outputAlias}`;
  };

  generateJsonWrapper = (
    outputQuery: string,
    baseQuery: string,
    baseAlias: string,
    jsonAlias: string
  ) => {
    return `SELECT row_to_json((${outputQuery})) AS ${jsonAlias} FROM (${baseQuery}) AS ${baseAlias}`;
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
