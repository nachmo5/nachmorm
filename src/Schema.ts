import Entity from './interfaces/Entity';
import Field from './interfaces/Field';
import ManyToOne from './interfaces/ManyToOne';
import OneToMany from './interfaces/OneToMany';

export default class Schema {
  $schema: Map<string, Entity> = new Map();

  constructor(schema: Entity[]) {
    this.validate(schema);
    this.createEntityMap(schema);
  }

  getEntity = (name: string) => {
    if (!this.$schema.has(name)) {
      throw new Error(`Entity ${name} not found in schema`);
    }
    return this.$schema.get(name);
  };

  getField = (entityName: string, fieldName: string) => {
    const entity: Entity | undefined = this.getEntity(entityName);
    if (!entity) return;
    const { fields = [] } = entity;
    const field = fields.find((f: Field) => f.name === fieldName);
    if (!field) {
      throw new Error(`Field ${fieldName} of entity ${entityName} not found in schema`);
    }
    return field;
  };

  getEntities = (): Entity[] => Array.from(this.$schema.values());

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
    // Entity should have one primary field
    this.validatePrimary(fields, entity.name);
    // Many To one
    manyToOne.forEach((mto) => this.validateManyToOne(mto, entity.name, entities));
    // one to many
    oneToMany.forEach((otm) => this.validateOneToMany(otm, entity.name, entities));
  };

  validateField = (field: Field, entityName: string) => {
    if (!field) {
      throw new Error(`Null field provided in entity ${entityName}`);
    }
    const { name, type, constraints = {} } = field;
    if (!field.name) {
      throw new Error(`No name provided for field in ${entityName}`);
    }
    if (!field.type) {
      throw new Error(`No type provided for ${field.name} in entity ${entityName}`);
    }
  };

  validatePrimary = (fields: Field[], entityName: string) => {
    if (fields.length === 0) return;
    let primaryCount = 0;
    fields.forEach((field) => {
      if ((field.constraints || {}).primary) primaryCount = primaryCount + 1;
    });
    if (primaryCount === 0) {
      throw new Error(`Entity ${entityName} does not have a primary field`);
    }
    if (primaryCount !== 1) {
      throw new Error(`Entity ${entityName} has multiple primary fields`);
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
    if (!targetEntityObj.fields?.find((field: Field) => field.name === targetField)) {
      throw new Error(
        `Many to one ${entityName}.${name}: Field ${targetField} in entity ${targetEntity} not found in schema`
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
