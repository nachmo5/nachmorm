import Constraints from './Constraints';
import { postgresColumnTypes, customFieldTypes } from '../enums';

export default interface Field {
  name: string;
  type: CustomFieldType | PostgresColumnType;
  typeOptions?: StringOptions | FloatOptions | DateTimeOptions;
  constraints?: Constraints;
}

export type PostgresColumnType = typeof postgresColumnTypes[number];

export type CustomFieldType = typeof customFieldTypes[number];

export interface StringOptions {
  length?: number;
}

export interface FloatOptions {
  precision?: number;
  scale?: number;
}

export interface DateTimeOptions {
  precision?: number;
}
