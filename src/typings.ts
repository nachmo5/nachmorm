import { ClientConfig } from 'pg';
import { aggregates, postgresColumnTypes, customFieldTypes } from './constants';

export interface Config {
  connection: ClientConfig;
  logging?: boolean;
}

export interface OutputAst {
  name: string;
  fields?: (string | OutputAst)[];
  args?: SelectArguments;
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
  type: CustomFieldType | PostgresColumnType;
  typeOptions?: StringOptions | FloatOptions | DateTimeOptions;
  constraints?: Constraints;
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
  defaultValue?: any;
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

export type PostgresColumnType = typeof postgresColumnTypes[number];

export type CustomFieldType = typeof customFieldTypes[number];

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

export type Aggregate = typeof aggregates[number];

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
