import Dictionary from './Dictionary';
import Schema from './Schema';
import Synchronizer from './Synchronizer';
import DatabaseClient from './DatabaseClient';

/*
We use typescript to
!1. missing validation :/
2. to know which type of data we use => avoid bugs + better code
3. as a documentation for the end user
*/
const entities = [
  {
    name: 'Book',
    fields: [
      {
        name: 'id',
        type: 'string',
        constraints: { primary: true },
      },
      { name: 'title', type: 'string' },
      { name: 'pages', type: 'integer', constraints: { defaultValue: 69 } },
    ],
    manyToOne: [
      { name: 'writer', targetEntity: 'Writer', targetField: 'id' },
      { name: 'sequel', targetEntity: 'Book', targetField: 'id' },
    ],
    oneToMany: [
      {
        name: 'characters',
        targetEntity: 'Character',
        targetManyToOne: 'book',
      },
    ],
  },
  {
    name: 'Writer',
    fields: [
      { name: 'id', type: 'string', constraints: { primary: true } },
      { name: 'firstName', type: 'string' },
      { name: 'lastName', type: 'string' },
    ],
    manyToOne: [{ name: 'wife', targetEntity: 'Writer', targetField: 'id' }],
    oneToMany: [
      { name: 'books', targetEntity: 'Book', targetManyToOne: 'writer' },
    ],
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
      { name: 'nickName', type: 'string', constraints: { unique: true } },
    ],
    manyToOne: [{ name: 'book', targetEntity: 'Book', targetField: 'id' }],
  },
];

const start = async () => {
  const dico = new Dictionary(entities);
  const schema = new Schema(entities);
  const client = new DatabaseClient({
    database: 'nachmorm',
    user: 'postgres',
    password: 'password',
    host: '127.0.0.1',
  });

  await client.connect();
  await new Synchronizer(schema, dico, client).synchronize();
};

start().then(() => console.log('started...'));
