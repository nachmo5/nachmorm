export default interface OneToMany {
  name: string;
  targetEntity: string; // Target Entity name
  targetManyToOne: string; // Many to one name
}
