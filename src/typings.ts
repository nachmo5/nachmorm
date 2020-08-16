import { ClientConfig } from 'pg';
import { aggregates, postgresColumnTypes, customFieldTypes } from './constants';

export interface DatabaseOrm {
  select(entityName: string, ast: SelectAst, values: any[]): Promise<unknown>;

  selectOne(entityName: string, ast: SelectAst, values: any[]): Promise<unknown>;

  aggregate(
    entityName: string,
    type: Aggregate,
    fieldOrOne: string | number,
    where: WhereAst,
    values: any[]
  ): Promise<unknown>;

  insert(entityName: string, ast: Record<string, unknown>, values: any[]): Promise<number>;

  update(
    entityName: string,
    ast: { [fieldName: string]: unknown },
    where: WhereAst,
    values: any[]
  ): Promise<number>;

  delete(entityName: string, where: WhereAst, values: any[]): Promise<number>;

  raw(query: string, values: any[]): Promise<unknown>;
}

export interface Config {
  connection: ClientConfig;
  logging?: boolean;
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
  offset?: number;
  limit?: number;
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
