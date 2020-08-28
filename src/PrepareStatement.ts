import { SelectAst, WhereAst, Predicate } from './typings';
import { mapObject } from './helpers';
import { operatorsMap } from './constants';

export default class PrepareStatetement {
  values: unknown[] = [];
  prepareSelect = (ast: SelectAst): SelectAst => {
    const { args = {}, manyToOne = [], oneToMany = [] } = ast;
    return {
      ...ast,
      manyToOne: manyToOne.map(this.prepareSelect),
      oneToMany: oneToMany.map(this.prepareSelect),
      args: {
        ...args,
        where: this.prepareWhere(args.where || {}) as WhereAst,
      },
    };
  };

  prepareWhere = (where: WhereAst): WhereAst =>
    mapObject<WhereAst | Predicate | WhereAst[] | undefined>(
      where,
      (key: string, value: WhereAst | Predicate | WhereAst[] | undefined) => {
        // SubAST
        if (!operatorsMap[key]) {
          if (Array.isArray(value)) return value.map(this.prepareWhere);
          if (typeof value === 'object') return this.prepareWhere(value as WhereAst);
        }
        // Predicate
        if (Array.isArray(value)) {
          const params = value.map((v, i) => this.getParam(i));
          this.values = [...this.values, ...value];
          return params;
        }
        if (key === '_isnull') return value;
        const param = this.getParam();
        this.values = [...this.values, value];
        return param;
      }
    );

  prepareRecord = (ast: Record<string, unknown>) =>
    mapObject(ast, (key: any, value: unknown) => {
      if (typeof value === 'object') {
        return this.prepareRecord(value as Record<string, unknown>);
      }
      const param = this.getParam();
      this.values = [...this.values, value];
      return param;
    });

  getParam = (offset = 0) => `$${this.values.length + 1 + offset}`;
}
