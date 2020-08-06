export default interface SelectAst {
  fields: string[];
  args: SelectArguments;
  manyToOne: SelectAst[];
  oneToMany: SelectAst[];
}

export interface SelectArguments {
  where: any;
  orderBy: any;
  offset: number;
  limit: number;
}
