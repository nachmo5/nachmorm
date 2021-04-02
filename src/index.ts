import Nachmorm from './Nachmorm';

export * from './typings';
export * from './enums';

export default Nachmorm;

const nachmorm = new Nachmorm(
  {
    logging: true,
    connection: {
      port: 5432,
      user: 'softeam',
      password: 'password',
      database: 'nachmode',
    },
  },
  [
    {
      name: 'Course',
      fields: [
        { name: 'id', type: 'varchar', constraints: { primary: true } },
        { name: 'title', type: 'varchar' },
        { name: 'duration', type: 'int' },
      ],
      manyToOne: [
        {
          name: 'instructor',
          targetEntity: 'Instructor',
          targetField: 'id',
        },
      ],
      oneToMany: [],
    },
    {
      name: 'Instructor',
      fields: [
        { name: 'id', type: 'varchar', constraints: { primary: true } },
        { name: 'fullName', type: 'varchar' },
        { name: 'age', type: 'int' },
      ],
      oneToMany: [{ name: 'courses', targetEntity: 'Course', targetManyToOne: 'instructor' }],
    },
  ]
);

nachmorm.connect().then(async (connection) => {
  const res = await connection.select('Course', { name: 'root' });
  console.log(res);
});
