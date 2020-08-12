import WhereAst from './WhereAst';
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
