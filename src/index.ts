import Schema from './Schema';
import Dictionary from './Dictionary';

const entities = [
  {
    name: 'Book',
    fields: [
      { name: 'id', type: 'string', constraints: { primary: true } },
      { name: 'title', type: 'string' },
      { name: 'pages', type: 'integer' },
    ],
    manyToOne: [
      { name: 'writer', targetEntity: 'Writer', targetField: 'id' },
      { name: 'sequel', targetEntity: 'Book', targetField: 'id' },
    ],
    oneToMany: [{ name: 'characters', targetEntity: 'Character', targetManyToOne: 'book' }],
  },
  {
    name: 'Writer',
    fields: [
      { name: 'id', type: 'string', constraints: { primary: true } },
      { name: 'firstName', type: 'string' },
      { name: 'lastName', type: 'string' },
    ],
    oneToMany: [{ name: 'books', targetEntity: 'Book', targetManyToOne: 'writer' }],
  },
  {
    name: 'Character',
    fields: [
      { name: 'id', type: 'string', constraints: { primary: true } },
      { name: 'nickName', type: 'string' },
    ],
    manyToOne: [{ name: 'book', targetEntity: 'Book', targetField: 'id' }],
  },
  {
    name: 'TmpToto',
    fields: [
      { name: 'id', type: 'string', constraints: { primary: true } },
      { name: 'nickName', type: 'string' },
    ],
    manyToOne: [{ name: 'book', targetEntity: 'Book', targetField: 'id' }],
  },
];

const dico = new Dictionary(entities);

console.log(dico.$dictionary);
