import { ClientConfig, QueryResult } from 'pg';
import { FieldTypeEnum, AggregateEnum, OperatorEnum, ReservedDefaultValueEnum } from './enums';

export interface Config {
  connection: ClientConfig;
  logging?: boolean;
}

export interface OutputAst {
  name: string;
  fields?: (string | OutputAst)[];
  args?: SelectArguments;
}

export interface Connection {
  select: (entityName: string, ast: OutputAst) => Promise<any>;
  selectOne: (entityName: string, ast: OutputAst) => Promise<any>;
  aggregate: (
    entityName: string,
    type: Aggregate,
    fieldOrOne: string | number,
    where: WhereAst
  ) => Promise<any>;
  insert: (entityName: string, ast: Record<string, unknown>) => Promise<any>;
  update: (entityName: string, ast: Record<string, unknown>, where: WhereAst) => Promise<any>;
  delete: (entityName: string, where: WhereAst) => Promise<any>;
  raw: (query: string, values: any[]) => Promise<QueryResult<any>>;
}

// -------------------------------------------------------------------------
// Schema
// -------------------------------------------------------------------------
export interface Entity {
  name: string;
  fields?: Field[];
  manyToOne?: ManyToOne[];
  oneToMany?: OneToMany[];
}

export interface Field {
  name: string;
  type: FieldType;
  typeOptions?: StringOptions | FloatOptions | DateTimeOptions;
  constraints?: Constraints;
  array?: boolean;
}

export interface ManyToOne {
  name: string;
  targetEntity: string;
  targetField: string;
  constraints?: Constraints;
}

export interface OneToMany {
  name: string;
  targetEntity: string;
  targetManyToOne: string;
}

export interface Constraints {
  primary?: boolean;
  notNull?: boolean;
  unique?: boolean;
  defaultValue?: ReservedDefaultValue | unknown;
}

export interface StringOptions {
  length?: number;
}

export interface FloatOptions {
  precision?: number;
  scale?: number;
}

export interface DateTimeOptions {
  precision?: number;
}

// -------------------------------------------------------------------------
// Select
// -------------------------------------------------------------------------

export interface SelectAst {
  name: string;
  fields?: string[];
  args?: SelectArguments;
  manyToOne?: SelectAst[];
  oneToMany?: SelectAst[];
  sideFields?: FlatField[];
}
export interface SelectArguments {
  where?: WhereAst;
  offset?: number | string;
  limit?: number | string;
  orderBy?: any;
  on?: [string, string];
}

export interface FlatField {
  path: string[];
  value: any;
  alias: string;
}

// -------------------------------------------------------------------------
// Where
// -------------------------------------------------------------------------

export interface WhereAst extends Record<string, WhereAst | Predicate | WhereAst[] | undefined> {
  _or?: WhereAst[];
  _and?: WhereAst[];
}

export interface Predicate {
  _eq?: any;
  _neq?: any;
  _like?: any;
  _ilike?: any;
  _nlike?: any;
  _in?: number[] | string[];
  _nin?: number[] | string[];
  _gt?: number | string;
  _gte?: number | string;
  _lt?: number | string;
  _lte?: number | string;
  _isnull?: boolean;
}

// -------------------------------------------------------------------------
// Dictionary
// -------------------------------------------------------------------------
export interface Relation {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
}

export interface IDictionary {
  names: Map<string, string>;
  relations: Map<string, Relation>;
}

// -------------------------------------------------------------------------
// Enum types
// -------------------------------------------------------------------------
export type Aggregate = keyof typeof AggregateEnum;

export type FieldType = keyof typeof FieldTypeEnum;

export type Operator = keyof typeof OperatorEnum;

export type ReservedDefaultValue = keyof typeof ReservedDefaultValueEnum;
