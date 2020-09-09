import Dictionary from '../Dictionary';
import Schema from '../Schema';
import { SelectAst, WhereAst, SelectArguments, Aggregate, FlatField } from '../typings';
import WhereBuilder from './WhereBuilder';
import { AggregateEnum } from '../enums';
import { flattenObject } from '../helpers';

export default class SelectQueryBuilder {
  $schema: Schema;
  $dictionary: Dictionary;
  $counterMap: { [prefix: string]: number } = {};

  constructor(schema: Schema, dictionary: Dictionary) {
    this.$schema = schema;
    this.$dictionary = dictionary;
  }

  selectOne = (entityName: string, ast: SelectAst) => {
    const jsonQuery = this.generateQuery(entityName, ast, false);
    const name = ast.name;
    return `SELECT coalesce((json_agg("${name}") -> 0), 'null') AS "${name}" FROM (${jsonQuery}) AS _final_root`;
  };

  select = (entityName: string, ast: SelectAst) => this.generateQuery(entityName, ast, true);

  aggregate = (entityName: string, type: Aggregate, param: string | number, where: WhereAst) => {
    if (!Object.keys(AggregateEnum).includes(type.toLowerCase())) {
      throw new Error(`Invalid aggregate function provided ${type}`);
    }
    const field = this.$schema.getField(entityName, param.toString(), false);
    const arg = field ? this.$dictionary.getColumn(entityName, field.name) : param;
    let query = `SELECT ${type}(${arg}) FROM ${this.$dictionary.getTable(entityName)} WHERE TRUE`;

    if (where && typeof where === 'object') {
      const whereBuilder = new WhereBuilder(this.$schema, this.$dictionary);
      query += ` AND ${whereBuilder.build(entityName, where)}`;
    }
    return query;
  };

  generateQuery = (entityName: string, ast: SelectAst, list: boolean) => {
    const { name, manyToOne = [], oneToMany = [], args = {}, sideFields = [] } = ast;
    /* ================ Fields Injection ============== */
    const orderByFields: FlatField[] = this.getOrderByFields(args.orderBy);
    this.injectSideFieldsToManyToOne([...sideFields, ...orderByFields], manyToOne);
    /* ================ BASE QUERY ============== */
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
    query = this.generateArgumentsWrapper(entityName, query, rootBaseAlias, args);
    /* ================ FORMATTING  ============== */
    const baseAlias = this.getAlias('base');
    // Output
    const outputQuery = this.generateOutputQuery(entityName, baseAlias, ast);
    // json
    query = this.generateJsonWrapper(entityName, outputQuery, query, baseAlias, name, [
      ...sideFields,
      ...orderByFields,
    ]);
    // agg
    if (list) query = this.generateAggregateWrapper(query, name, orderByFields);
    return query;
  };

  generateBaseQuery = (entityName: string, alias: string) => {
    const tableName = this.$dictionary.getTable(entityName);
    return `SELECT * FROM "${tableName}" AS "${alias}"`;
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
    const { where, offset, limit, on } = args;
    let queryWithArgs = `${query} WHERE true`;
    if (on) queryWithArgs += ` AND "${alias}"."${on[0]}" = ${on[1]}`;
    if (where && typeof where === 'object') {
      const whereBuilder = new WhereBuilder(this.$schema, this.$dictionary);
      queryWithArgs += ` AND ${whereBuilder.build(entityName, where, alias)}`;
    }
    if (offset && parseInt(offset as string, 10) > 0) queryWithArgs += ` OFFSET ${offset}`;
    if (limit && parseInt(limit as string, 10) > 0) queryWithArgs += ` LIMIT ${limit}`;
    return queryWithArgs;
  };

  generateOutputQuery = (entityName: string, baseAlias: string, ast: SelectAst) => {
    const { fields = [], manyToOne = [], oneToMany = [] } = ast;
    const outputAlias = this.getAlias('o');
    const columns: string[] = fields.map(
      (fieldName) =>
        `"${baseAlias}"."${this.$dictionary.getColumn(entityName, fieldName)}" AS "${fieldName}"`
    );
    const joinColumns = [...manyToOne, ...oneToMany].map((rel) => `"${baseAlias}"."${rel.name}"`);
    return `SELECT "${outputAlias}" FROM (SELECT ${[...columns, ...joinColumns].join(
      ', '
    )}) AS "${outputAlias}"`;
  };

  generateJsonWrapper = (
    entityName: string,
    outputQuery: string,
    baseQuery: string,
    baseAlias: string,
    jsonAlias: string,
    sideFields: FlatField[]
  ) => {
    // Order by fields
    const orderByFields = sideFields.map((sideField) => {
      if (sideField.path.length > 1) {
        return `"${baseAlias}"."${sideField.alias}"`;
      }
      if (sideField.path.length === 1) {
        const fieldName = sideField.path[0];
        const columnName = this.$dictionary.getColumn(entityName, fieldName);
        return `"${baseAlias}"."${columnName}" AS "${sideField.alias}"`;
      }
      throw new Error(`Order by field not found ${sideField.alias}`);
    });
    // JSON QUERY
    const outputs = [`row_to_json((${outputQuery})) AS "${jsonAlias}"`, ...orderByFields];
    return `SELECT ${outputs.join(', ')} FROM (${baseQuery}) AS "${baseAlias}"`;
  };

  generateAggregateWrapper = (query: string, alias: string, orderByFields: FlatField[]) => {
    // Order by
    const orderByStrs = orderByFields.map(
      (obf) => `"${obf.alias}" ${obf.value.toLowerCase() === 'asc' ? 'ASC' : 'DESC'} NULLS LAST`
    );
    const orderByStr = orderByStrs.length > 0 ? ` ORDER BY ${orderByStrs.join(', ')}` : '';
    // Agg query
    const queryAlias = this.getAlias('agg');
    return `SELECT coalesce(json_agg("${alias}"${orderByStr}), '[]') AS "${alias}" FROM (${query}) AS "${queryAlias}"`;
  };

  getOrderByFields = (orderBy = {}): FlatField[] =>
    flattenObject(orderBy || {}, [], (path) => ['ob', ...path].join('.'));

  injectSideFieldsToManyToOne = (sideFields: FlatField[], manyToOne: SelectAst[]) => {
    sideFields.forEach((orderByField) => {
      if (orderByField.path.length <= 1) return;
      const relationName = orderByField.path[0];
      const mtoIndex = manyToOne.findIndex((mto) => mto.name === relationName);
      // Truncate path
      const truncatedField = {
        ...orderByField,
        path: orderByField.path.slice(1),
      };
      // If join doesn't exists, add it
      if (mtoIndex === -1) {
        manyToOne.push({
          name: relationName,
          sideFields: [truncatedField],
        });
      } else {
        manyToOne[mtoIndex].sideFields = [
          ...(manyToOne[mtoIndex].sideFields || []),
          truncatedField,
        ];
      }
    });
  };

  getAlias = (prefix: string) => {
    if (!this.$counterMap[prefix]) this.$counterMap[prefix] = 0;
    const alias = `${prefix}_${this.$counterMap[prefix]}`;
    this.$counterMap[prefix] = this.$counterMap[prefix] + 1;
    return alias;
  };
}
