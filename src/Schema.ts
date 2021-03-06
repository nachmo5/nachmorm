import { Entity, Field, ManyToOne, OneToMany } from './typings';
import { FieldTypeEnum } from './enums';

export default class Schema {
  $schema: Map<string, Entity> = new Map();

  constructor(schema: Entity[]) {
    this.validate(schema);
    this.createEntityMap(schema);
  }

  getEntity = (name: string, strict = true) => {
    if (strict && !this.$schema.has(name)) {
      throw new Error(`Entity ${name} not found in schema`);
    }
    return this.$schema.get(name);
  };

  getField = (entityName: string, fieldName: string, strict = true) => {
    const entity: Entity | undefined = this.getEntity(entityName, strict);
    if (!entity) return;
    const { fields = [] } = entity;
    const field = fields.find((f: Field) => f.name === fieldName);
    if (strict && !field) {
      throw new Error(`Field ${fieldName} of entity ${entityName} not found in schema`);
    }
    return field;
  };

  getManyToOne = (entityName: string, relationName: string, strict = true) => {
    const entity: Entity | undefined = this.getEntity(entityName, strict);
    if (!entity) return;
    const { manyToOne = [] } = entity;
    const mto = manyToOne.find((r: ManyToOne) => r.name === relationName);
    if (strict && !mto) {
      throw new Error(`Relation ${relationName} of entity ${entityName} not found in schema`);
    }
    return mto;
  };

  getOneToMany = (entityName: string, relationName: string, strict = true) => {
    const entity: Entity | undefined = this.getEntity(entityName, strict);
    if (!entity) return;
    const { oneToMany = [] } = entity;
    const mto = oneToMany.find((r: OneToMany) => r.name === relationName);
    if (strict && !mto) {
      throw new Error(`Relation ${relationName} of entity ${entityName} not found in schema`);
    }
    return mto;
  };

  getEntities = (): Entity[] => Array.from(this.$schema.values());

  /* ========================================================== */
  /* ========================= CREATION ===================== */
  /* ========================================================== */

  createEntityMap = (entities: Entity[]) => {
    entities.forEach((entity) => this.$schema.set(entity.name, entity));
  };

  /* ========================================================== */
  /* ========================= VALIDATION ===================== */
  /* ========================================================== */

  validate = (entities: Entity[]) => {
    try {
      entities.forEach((entity) => this.validateEntity(entity, entities));
    } catch (e) {
      throw new Error(`Schema validation error: ${e.message}`);
    }
  };

  validateEntity = (entity: Entity, entities: Entity[]) => {
    if (!entity) {
      throw new Error('Null entity provided');
    }
    if (!entity.name) {
      throw new Error('Invalid entity, missing name');
    }
    const { fields = [], manyToOne = [], oneToMany = [] } = entity;
    // Fields
    fields.forEach((field) => this.validateField(field, entity.name));
    // Many To one
    manyToOne.forEach((mto) => this.validateManyToOne(mto, entity.name, entities));
    // one to many
    oneToMany.forEach((otm) => this.validateOneToMany(otm, entity.name, entities));
  };

  validateField = (field: Field, entityName: string) => {
    if (!field) {
      throw new Error(`Null field provided in entity ${entityName}`);
    }
    const { name, type } = field;
    if (!name) {
      throw new Error(`No name provided for field in ${entityName}`);
    }

    if (!type) {
      throw new Error(`No type provided for ${field.name} in entity ${entityName}`);
    }

    if (!Object.keys(FieldTypeEnum).includes(type.toLowerCase())) {
      throw new Error(`Invalid type ${type} provided for ${field.name} in entity ${entityName}`);
    }
  };

  validateManyToOne = (manyToOne: ManyToOne, entityName: string, entities: Entity[]) => {
    if (!manyToOne) {
      throw new Error(`Null manyToOne provided in entity ${entityName}`);
    }

    const { name, targetEntity, targetField } = manyToOne;
    if (!name) {
      throw new Error(`No name provided for manytoone in ${entityName}`);
    }

    if (!manyToOne.targetEntity) {
      throw new Error(
        `Property targetEntity not provided for manytoone ${name} in entity ${entityName}`
      );
    }

    if (!manyToOne.targetField) {
      throw new Error(
        `Property targetField not provided for manytoone ${name} in entity ${entityName}`
      );
    }

    const targetEntityObj = entities.find((entity: Entity) => entity.name === targetEntity);

    if (!targetEntityObj) {
      throw new Error(
        `Many to one ${entityName}.${name}: Target entity ${targetEntity} not found in schema`
      );
    }

    const targetFieldObj = targetEntityObj.fields?.find(
      (field: Field) => field.name === targetField
    );

    if (!targetFieldObj) {
      throw new Error(
        `Many to one ${entityName}.${name}: Field ${targetField} in entity ${targetEntity} not found in schema`
      );
    }

    if (!targetFieldObj.constraints?.primary && !targetFieldObj.constraints?.unique) {
      throw new Error(
        `Many to one ${entityName}.${name}: Field ${targetField} in entity ${targetEntity} is not unique or primary`
      );
    }
  };

  validateOneToMany = (oneToMany: OneToMany, entityName: string, entities: Entity[]) => {
    if (!oneToMany) {
      throw new Error(`Null oneToMany provided in entity ${entityName}`);
    }

    const { name, targetEntity, targetManyToOne } = oneToMany;
    if (!name) {
      throw new Error(`No name provided for manytoone in ${entityName}`);
    }

    if (!oneToMany.targetEntity) {
      throw new Error(
        `Property targetEntity not provided for oneToMany ${name} in entity ${entityName}`
      );
    }

    if (!oneToMany.targetManyToOne) {
      throw new Error(
        `Property targetManyToOne not provided for oneToMany ${name} in entity ${entityName}`
      );
    }

    const targetEntityObj = entities.find((entity) => entity.name === targetEntity);
    if (!targetEntityObj) {
      throw new Error(
        `Many to one ${entityName}.${name}: Target entity ${targetEntity} not found in schema`
      );
    }
    if (!targetEntityObj.manyToOne?.find((mto: ManyToOne) => mto.name === targetManyToOne)) {
      throw new Error(
        `Many to one ${entityName}.${name}: Manytoone ${targetManyToOne} in entity ${targetEntity} not found in schema`
      );
    }
  };
}
