import Constraint from './Constraint';

export default interface ManyToOne {
  name: string;
  targetEntity: string; // Target Entity name
  targetField: string; // Target Field name
  constraints?: Constraint;
}
