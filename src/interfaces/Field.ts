import Constraint from './Constraint';

export default interface Field {
  name: string;
  type: string;
  typeOptions?: string[];
  constraints?: Constraint;
}
