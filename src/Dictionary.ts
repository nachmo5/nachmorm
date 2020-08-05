import lodashSnakecase from 'lodash.snakecase';

import Entity from './interfaces/Entity';
import ManyToOne from './interfaces/ManyToOne';
import OneToMany from './interfaces/OneToMany';
import Relation from './interfaces/Relation';

export default class Dictionary {
  $dictionary: IDictionary = { names: new Map(), relations: new Map() };

  constructor(entities: Entity[], customs: any = {}) {
    // Names
    entities.forEach((entity) => {
      const { name, fields = [] } = entity;
      this.addEntity(name, customs[name]);
      fields.forEach((field) =>
        this.addField(name, field.name, customs[`${name}.${field.name}`])
      );
    });
    // Many To one
    entities.forEach((entity) => {
      const { name, manyToOne = [] } = entity;
      manyToOne.forEach((mto) =>
        this.addManyToOne(name, mto, customs[`${name}.${mto.name}`])
      );
    });
    // One To many
    entities.forEach((entity) => {
      const { name, oneToMany = [] } = entity;
      oneToMany.forEach((otm) => this.addOneToMany(name, otm));
    });
  }

  addEntity = (entityName: string, custom?: string) => {
    const tableName = custom ? custom : lodashSnakecase(entityName);
    this.$dictionary.names.set(entityName, tableName);
  };

  addField = (entityName: string, fieldName: string, custom?: string) => {
    const columnName = custom ? custom : lodashSnakecase(fieldName);
    this.$dictionary.names.set(`${entityName}.${fieldName}`, columnName);
  };

  addManyToOne = (
    entityName: string,
    manyToOne: ManyToOne,
    custom?: string
  ) => {
    const { name, targetEntity, targetField } = manyToOne;

    const foreignKeyName = custom
      ? custom
      : `${lodashSnakecase(name)}_${this.getColumn(targetEntity, targetField)}`;

    const relation: Relation = {
      fromTable: this.getTable(entityName),
      fromColumn: foreignKeyName,
      toTable: this.getTable(targetEntity),
      toColumn: this.getColumn(targetEntity, targetField),
    };
    this.$dictionary.relations.set(`${entityName}.${name}`, relation);
  };

  addOneToMany = (entityName: string, oneToMany: OneToMany) => {
    const { name, targetEntity, targetManyToOne } = oneToMany;
    const manyToOneRelation = this.getRelation(targetEntity, targetManyToOne);
    const relation: Relation = {
      fromTable: manyToOneRelation.toTable,
      fromColumn: manyToOneRelation.toColumn,
      toTable: manyToOneRelation.fromTable,
      toColumn: manyToOneRelation.fromColumn,
    };
    this.$dictionary.relations.set(`${entityName}.${name}`, relation);
  };

  getTable = (entityName: string) => {
    const table = this.$dictionary.names.get(entityName);
    if (!table) {
      throw new Error(
        `Entity ${entityName} has no corresponding table in the dictionary`
      );
    }
    return table;
  };

  getColumn = (entityName: string, fieldName: string) => {
    const column = this.$dictionary.names.get(`${entityName}.${fieldName}`);
    if (!column) {
      throw new Error(
        `Field ${entityName}.${fieldName} has no corresponding column in the dictionary`
      );
    }
    return column;
  };

  getRelation = (entityName: string, relationName: string) => {
    const relation = this.$dictionary.relations.get(
      `${entityName}.${relationName}`
    );
    if (!relation) {
      throw new Error(
        `Relation ${entityName}.${relationName} has no corresponding relation in the dictionary`
      );
    }
    return relation;
  };
}

interface IDictionary {
  names: Map<string, string>;
  relations: Map<string, Relation>;
}
