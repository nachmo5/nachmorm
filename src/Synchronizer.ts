import Dictionary from './Dictionary';
import Schema from './Schema';
import DatabaseClient from './DatabaseClient';
import { Entity, ManyToOne, Field, StringOptions, FloatOptions, DateTimeOptions } from './typings';

export default class Synchronizer {
  $schema: Schema;
  $dictionary: Dictionary;
  $client: DatabaseClient;

  constructor(schema: Schema, dictionary: Dictionary, client: DatabaseClient) {
    this.$schema = schema;
    this.$dictionary = dictionary;
    this.$client = client;
  }

  synchronize = async () => {
    const databaseSchema = await this.getDatabaseSchema();
    const query = this.buildSchemaQuery(databaseSchema);
    const constraintsQuery = this.buildConstraintsQuery(databaseSchema);
    if (query === '' && constraintsQuery === '') return true;
    return this.$client.query([query, constraintsQuery].join('\n'));
  };

  // Checking if entity already exists in database then generate alter/create query accordingly
  buildSchemaQuery = (databaseSchema: Schema): string =>
    this.$schema
      .getEntities()
      .map((entity) =>
        databaseSchema.getEntity(this.$dictionary.getTable(entity.name), false)
          ? this.generateAlterTableQuery(entity, databaseSchema)
          : this.generateCreateTableQuery(entity)
      )
      .filter((e) => e !== '')
      .join('\n');

  buildConstraintsQuery = (databaseSchema: Schema) =>
    this.$schema
      .getEntities()
      .map((entity) => {
        const { manyToOne = [] } = entity;
        const fkConstraints = manyToOne
          .filter((mto) => {
            // add only if the column is didn't exist before
            const relation = this.$dictionary.getRelation(entity.name, mto.name);
            return databaseSchema.getField(relation.fromTable, relation.fromColumn, false)
              ? false
              : true;
          })
          .map((mto) => {
            const relation = this.$dictionary.getRelation(entity.name, mto.name);
            const constraintName = `${relation.fromTable}_${relation.fromColumn}_fkey`;
            return `ADD CONSTRAINT ${constraintName} FOREIGN KEY (${relation.fromColumn}) REFERENCES ${relation.toTable} (${relation.toColumn}) ON DELETE CASCADE`;
          });
        if (fkConstraints.length <= 0) return '';
        return `ALTER TABLE ${this.$dictionary.getTable(entity.name)} ${fkConstraints.join(', ')};`;
      })
      .filter((e) => e !== '')
      .join('\n');

  generateCreateTableQuery = (entity: Entity): string => {
    const { fields = [], manyToOne = [] } = entity;
    const columns = fields.map((field) => this.generateColumnQuery(field, entity.name));
    const foreignKeys = manyToOne.map((mto) =>
      this.generateForeignKeyColumnQuery(mto, entity.name)
    );
    return `CREATE TABLE ${this.$dictionary.getTable(entity.name)} (\n${[
      ...columns,
      ...foreignKeys,
    ].join(',\n')});\n`;
  };

  generateAlterTableQuery = (entity: Entity, databaseSchema: Schema) => {
    const { fields = [], manyToOne = [] } = entity;
    // Filter already existing fields
    const fieldsToCreate = fields.reduce((acc: Field[], field) => {
      const tableName = this.$dictionary.getTable(entity.name);
      const columnName = this.$dictionary.getColumn(entity.name, field.name);
      if (databaseSchema.getField(tableName, columnName, false)) return acc;
      return [...acc, field];
    }, []);

    // Filter already existing foreign keys
    const foreignKeysToCreate = manyToOne.reduce((acc: ManyToOne[], mto) => {
      const relation = this.$dictionary.getRelation(entity.name, mto.name);
      const databaseColumn = databaseSchema.getField(
        relation.fromTable,
        relation.fromColumn,
        false
      );
      if (databaseColumn) return acc;
      return [...acc, mto];
    }, []);

    const columns = fieldsToCreate.map((field) => this.generateColumnQuery(field, entity.name));

    const foreignKeys = foreignKeysToCreate.map((mto) =>
      this.generateForeignKeyColumnQuery(mto, entity.name)
    );

    const addColumnQueries = [...columns, ...foreignKeys].map((column) => `ADD COLUMN ${column}`);
    if (addColumnQueries.length <= 0) return '';

    return `ALTER TABLE ${this.$dictionary.getTable(entity.name)} \n${addColumnQueries.join(
      ',\n'
    )};\n`;
  };

  generateForeignKeyColumnQuery = (mto: ManyToOne, entityName: string) => {
    // Look up referenced field
    const targetField = this.$schema.getField(mto.targetEntity, mto.targetField);
    if (!targetField) return '';
    const relation = this.$dictionary.getRelation(entityName, mto.name);
    const { fromColumn } = relation;
    return [fromColumn, targetField.type].filter((s) => !!s).join(' ');
  };

  generateColumnQuery = (field: Field, entityName: string): string => {
    const { name, type, constraints = {}, typeOptions = {}, array } = field;
    // Type options
    const options = [];
    if ((typeOptions as StringOptions).length) {
      options.push((typeOptions as StringOptions).length);
    }
    if ((typeOptions as FloatOptions).scale) {
      options.push((typeOptions as FloatOptions).precision);
      options.push((typeOptions as FloatOptions).scale);
    }
    if ((typeOptions as DateTimeOptions).precision) {
      options.push((typeOptions as DateTimeOptions).precision);
    }
    const strTypeOptions = options.length > 0 ? `( ${options.join(', ')} )` : '';
    // Constraints
    const strConstraints: string[] = [];
    if (constraints.primary) strConstraints.push('PRIMARY KEY');
    if (constraints.unique) strConstraints.push('UNIQUE');
    if (constraints.notNull) strConstraints.push('NOT NULL');
    if (constraints.defaultValue) {
      strConstraints.push(`DEFAULT ${constraints.defaultValue}`);
    }
    return [
      this.$dictionary.getColumn(entityName, name),
      type + (array ? '[]' : ''),
      strTypeOptions,
      strConstraints,
    ]
      .filter((s) => !!s)
      .join(' ');
  };

  /* ========================================================== */
  /* ========================= DATABASE SCHEMA ================ */
  /* ========================================================== */

  getDatabaseSchema = async (): Promise<Schema> => {
    const rawSchema = await this.$client.query(`
    select tables.table_name, columns
    from information_schema.tables as tables
    left join lateral (
        select
            json_agg(
                (
                    cols.column_name,
                    cols.data_type,
                    cols.character_maximum_length,
                    cols.is_nullable,
                    cols.column_default
                )
            ) as columns
        from
            information_schema.columns as cols
        where
            cols.table_name = tables.table_name
    ) as c on true
    where tables.table_schema not in ('information_schema', 'pg_catalog')
    `);
    return new Schema(rawSchema.rows.map(this.tableToEntity));
  };

  tableToEntity = (rawTable: any): Entity => {
    const { table_name, columns = [] } = rawTable;
    return {
      name: table_name,
      fields: (columns || []).map(this.columnToField),
    };
  };

  columnToField = (column: any): Field => {
    const { f1: name, f2: type, f3: size, f4: nullable, f5: defaultValue } = column;
    const typeOptions = size ? { length: size } : {};
    return {
      name,
      type,
      typeOptions,
      constraints: { defaultValue, notNull: !nullable },
    };
  };
}
