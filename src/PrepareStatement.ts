import { SelectAst, WhereAst, Predicate } from './typings';
import { mapObject } from './helpers';
import { OperatorEnum } from './enums';
import Schema from './Schema';

export default class PrepareStatetement {
  values: unknown[] = [];
  $schema: Schema;

  constructor(schema: Schema) {
    this.$schema = schema;
  }

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
        if (!Object.keys(OperatorEnum).includes(key)) {
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

  prepareRecord = (ast: Record<string, unknown>, entityName: string) =>
    mapObject(ast, (fieldName: any, value: unknown) => {
      if (this.$schema.getField(entityName, fieldName, false)) {
        const param = this.getParam();
        this.values = [...this.values, value];
        return param;
      }

      const mto = this.$schema.getManyToOne(entityName, fieldName, false);
      if (mto) {
        return this.prepareRecord(value as Record<string, unknown>, mto.targetEntity);
      }
      const otm = this.$schema.getOneToMany(entityName, fieldName, false);
      if (otm) {
        return (value as []).map((el) =>
          this.prepareRecord(el as Record<string, unknown>, otm.targetEntity)
        );
      }

      throw new Error(`Invalid field provided ${entityName}.${fieldName}`);
    });

  getParam = (offset = 0) => `$${this.values.length + 1 + offset}`;
}
