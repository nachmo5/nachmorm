import { WhereAst, Predicate } from '../typings';
import Dictionary from '../Dictionary';
import Schema from '../Schema';
import { forEachObject, reduceObject } from '../helpers';
import { operatorsMap } from '../constants';

export default class WhereBuilder {
  $schema: Schema;
  $dictionary: Dictionary;
  $counter = 0;

  constructor(schema: Schema, dictionary: Dictionary) {
    this.$schema = schema;
    this.$dictionary = dictionary;
  }

  build = (entityName: string, where: WhereAst, alias?: string): string => {
    this.$counter = 0;
    const tableName = alias ? alias : this.$dictionary.getTable(entityName);
    return this.buildEntityWhere(entityName, tableName, where);
  };

  buildEntityWhere = (entityName: string, alias: string, where: WhereAst): string => {
    const { _and = [], _or = [], ...fields } = where;
    const conditions: string[] = reduceObject(
      fields,
      (acc, fieldName, subAst) => {
        // Field
        const field = this.$schema.getField(entityName, fieldName, false);
        if (field) {
          return [...acc, ...this.buildFieldWhere(entityName, alias, field.name, subAst)];
        }
        // Many to one
        const mto = this.$schema.getManyToOne(entityName, fieldName, false);
        if (mto) {
          return [
            ...acc,
            this.buildRelationWhere(entityName, alias, fieldName, mto.targetEntity, subAst),
          ];
        }
        // One to many
        const otm = this.$schema.getOneToMany(entityName, fieldName, false);
        if (otm) {
          return [
            ...acc,
            this.buildRelationWhere(entityName, alias, fieldName, otm.targetEntity, subAst),
          ];
        }
        return [...acc];
      },
      []
    );
    // MERGE CONDITIONS INTO WITH LOGICAL LINKS
    const andConditions = _and.map((andCondition) =>
      this.buildEntityWhere(entityName, alias, andCondition)
    );

    const orConditionStr: string | null = _or.reduce((acc: string | null, orCondition) => {
      const subCondition = this.buildEntityWhere(entityName, alias, orCondition);
      if (subCondition === '') return acc;
      if (!acc) return `(${subCondition})`;
      return `${acc} OR (${subCondition})`;
    }, null);

    const orConditions = orConditionStr ? [`( ${orConditionStr} )`] : [];
    const result = [...conditions, ...andConditions, ...orConditions].join(' AND ');
    return result === '' ? 'true' : result;
  };

  buildFieldWhere = (
    entityName: string,
    alias: string,
    fieldName: string,
    predicate: Predicate
  ) => {
    const column = this.$dictionary.getColumn(entityName, fieldName);
    return forEachObject(predicate, (operator, value) =>
      this.buildOperation(`"${alias}"."${column}"`, operator, value)
    );
  };

  buildRelationWhere = (
    entityName: string,
    alias: string,
    relationName: string,
    targetEntity: string,
    subAst: WhereAst
  ) => {
    const targetTable = this.$dictionary.getTable(targetEntity);
    const relation = this.$dictionary.getRelation(entityName, relationName);
    const joinAlias = this.getAlias('w');
    const joinCondition = `"${joinAlias}"."${relation.toColumn}" = "${alias}"."${relation.fromColumn}"`;
    return `( EXISTS ( SELECT 1 FROM "${targetTable}" AS "${joinAlias}" WHERE ${joinCondition} AND ${this.buildEntityWhere(
      targetEntity,
      joinAlias,
      subAst
    )} ) )`;
  };

  buildOperation = (operand: string, operator: string, value: any) => {
    const op: string = operatorsMap[operator];
    if (!op) {
      throw new Error(`Invalid operator ${operator}`);
    }
    if (operator === '_in' || operator === '_nin') {
      return `${operand} ${operatorsMap[operator]} (${value.join(', ')})`;
    }
    if (operator === '_isnull') {
      return `${operand} ${value ? 'IS NULL' : 'IS NOT NULL'}`;
    }
    return `${operand} ${operatorsMap[operator]} ${value}`;
  };

  getAlias = (prefix: string) => {
    const alias = `${prefix}_${this.$counter}`;
    this.$counter = this.$counter + 1;
    return alias;
  };
}
