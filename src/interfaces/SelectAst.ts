import { FlatField } from './Helpers';

export default interface SelectAst {
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

export interface WhereAst
  extends Record<string, WhereAst | Predicate | WhereAst[] | undefined> {
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
