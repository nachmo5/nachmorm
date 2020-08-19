# Nachmorm

ORM for flexible queries to postgresql databases.
It will only query the fields that you ask for.

# Install

    npm install --save nachmorm

# Define your entities
    const entities = [
      {
        name: 'Book',
        fields: [
          { name: 'id', type: 'string' },
          { name: 'title', type: 'string' },
          { name: 'pageCount', type: 'number' },
        ],
        manyToOne: [{ name: 'writer', targetEntity: 'Writer',   targetField: 'id' }],
      },
      {
        name: 'Writer',
        fields: [
          { name: 'id', type: 'string' },
          { name: 'name', type: 'string' },
        ],
        oneToMany: [
          { name: 'books', targetEntity: 'Book', targetManyToOne:   'writer' },
        ],
      },
    ];


# Create orm instance
    const nachmorm = new Nachmorm(
      {
        connection: {
          host: 'localhost',
          user: 'youruser',
          password: 'yourpassword',
          database: 'yourdatabasename',
        },
      },
      entities
    );

# Get connection
    const connection = await nachmorm.connect();

# Start querying
        const result = await connection.select('Book', {
          name: 'books',
          fields: ['id'],
          manyToOne: [
            {
              name: 'writer',
              fields: ['name'],
              oneToMany: [{ name: 'books', fields: ['title'] }],
            },
          ],
        });

