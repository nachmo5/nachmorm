import Constraints from './Constraints';
import {
  StringOptions,
  FloatOptions,
  DateTimeOptions,
} from './FieldTypeOptions';
import { CustomFieldType, PostgresColumnType } from '../enums';

export default interface Field {
  name: string;
  type: CustomFieldType | PostgresColumnType;
  typeOptions?: StringOptions | FloatOptions | DateTimeOptions;
  constraints?: Constraints;
}
