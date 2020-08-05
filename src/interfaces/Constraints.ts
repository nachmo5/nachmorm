export default interface Constraint {
  primary?: boolean;
  notNull?: boolean;
  unique?: boolean;
  defaultValue?: any;
}
