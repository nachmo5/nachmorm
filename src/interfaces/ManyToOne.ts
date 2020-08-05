import Constraints from './Constraints';

export default interface ManyToOne {
  name: string;
  targetEntity: string; // Target Entity name
  targetField: string; // Target Field name
  constraints?: Constraints;
}
