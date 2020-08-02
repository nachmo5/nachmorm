import Field from './Field';
import ManyToOne from './ManyToOne';
import OneToMany from './OneToMany';

export default interface Entity {
  name: string;
  fields?: Field[];
  manyToOne?: ManyToOne[];
  oneToMany?: OneToMany[];
}
