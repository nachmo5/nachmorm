import { OutputAst, SelectAst } from './typings';
import Schema from './Schema';

const mapOutputAst = (outputAst: OutputAst, entityName: string, $schema: Schema): SelectAst => {
  const { name, args = {}, fields = [] } = outputAst;
  return fields.reduce(
    (acc: SelectAst, astField: OutputAst | string) => {
      if (typeof astField === 'string') {
        return { ...acc, fields: [...(acc.fields || []), astField] };
      }
      const field = $schema.getField(entityName, astField.name, false);
      if (field) {
        return { ...acc, fields: [...(acc.fields || []), field.name] };
      }
      const mto = $schema.getManyToOne(entityName, astField.name, false);
      if (mto) {
        return {
          ...acc,
          manyToOne: [...(acc.manyToOne || []), mapOutputAst(astField, mto.targetEntity, $schema)],
        };
      }
      const otm = $schema.getOneToMany(entityName, astField.name, false);
      if (otm) {
        return {
          ...acc,
          oneToMany: [...(acc.oneToMany || []), mapOutputAst(astField, otm.targetEntity, $schema)],
        };
      }
      throw new Error(`Field ${astField.name} not found in schema`);
    },
    { name, args, manyToOne: [], oneToMany: [], fields: [] }
  );
};

export default mapOutputAst;
