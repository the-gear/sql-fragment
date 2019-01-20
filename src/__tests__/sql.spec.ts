// tslint:disable:no-any
// tslint:disable:no-unsafe-any
// tslint:disable:no-magic-numbers
import sql from '..';
import './serializer';

jest.mock('../environment.ts', () => ({
  IS_DEV: true,
  IS_PROD: false,
}));

describe('sql tag', () => {
  it('should accept single string', () => {
    expect(sql`SELECT * FROM foo`).toMatchSnapshot();
  });

  it('should accept parametrized string', () => {
    const q = sql`SELECT ${1} as i, ${'string value'} as s`;
    expect(q.toJSON()).toMatchSnapshot('JSON serialized');
    expect(q).toMatchSnapshot();
  });

  it('should accept $id transform', () => {
    expect(sql`SELECT * from $id${'table'}`).toMatchSnapshot();
  });

  it('should mix transforms and variables correctly', () => {
    expect(
      sql`SELECT ${1} as $id${'col1'}, ${2} as $id${'col2'} from $id${'table'}`,
    ).toMatchSnapshot();
  });

  it('composes well', () => {
    const q1 = sql`${2}, ${3}`;
    const q2 = sql`${1}, ${q1}, ${4}`;
    expect(sql`VALUES (${q2}), (${q1}, ${q1})`).toMatchSnapshot();
  });

  it('parse without args', () => {
    const q = sql`SELECT * FROM test`;
    expect(q.text).toBe('SELECT * FROM test');
    expect(q.values.length).toBe(0);
    expect(q.toString()).toBe('SELECT * FROM test');
  });

  it('parse with custom formater arg', () => {
    const value1 = {
      toPostgres() {
        return 'raw text value';
      },
    };
    const q = sql`SELECT ${value1}`;
    expect(q.text).toBe('SELECT $1');
    expect(q.values.length).toBe(1);
    expect(q.values[0]).toBe(value1);
    expect(q.toString()).toBe("SELECT 'raw text value'");
    // cover caching
    expect(q.toString()).toBe("SELECT 'raw text value'");
  });

  it('parse with null arg', () => {
    const value1 = null;
    const q = sql`SELECT ${value1}`;
    expect(q.text).toBe('SELECT $1');
    expect(q.values.length).toBe(1);
    expect(q.values[0]).toBe(null);
    expect(q.toString()).toBe('SELECT NULL');
    // cover caching
    expect(q.toString()).toBe('SELECT NULL');
  });

  it('parse literal transform with null arg', () => {
    const value1 = null;
    const q = sql`SELECT $${value1}`;
    expect(q.text).toBe('SELECT NULL');
    expect(q.values.length).toBe(0);
    expect(q.toString()).toBe('SELECT NULL');
  });

  it('parse literal transform with string arg', () => {
    const value1 = 'ABC';
    const q = sql`SELECT $${value1}`;
    expect(q.text).toBe("SELECT 'ABC'");
    expect(q.values.length).toBe(0);
    expect(q.toString()).toBe("SELECT 'ABC'");
  });

  it('parse nested literal transform arg', () => {
    const value1 = sql`${'ABC'}`;
    const q = sql`SELECT $${value1}`;
    expect(q.text).toBe('SELECT $1');
    expect(q.values.length).toBe(1);
    expect(q.values[0]).toBe('ABC');
    expect(q.toString()).toBe("SELECT 'ABC'");
  });

  it('parse with SQL formater arg', () => {
    const value1 = {
      toSQL() {
        return sql`123.45::numeric(15,2)`;
      },
    };
    const q = sql`SELECT ${value1}`;
    expect(q.text).toBe('SELECT 123.45::numeric(15,2)');
    expect(q.values.length).toBe(0);
    expect(q.toString()).toBe('SELECT 123.45::numeric(15,2)');
  });

  it('parse with nested SQL', () => {
    const ip = '127.0.0.1';
    const login = 'langpavel';
    const userIdSql = sql`(select id from user where login = ${login})`;
    const auditSql = sql`insert into audit (uder_id, ip) values (${userIdSql}, ${ip})`;

    expect(userIdSql.text).toBe('(select id from user where login = $1)');
    expect(userIdSql.values.length).toBe(1);
    expect(userIdSql.values[0]).toBe(login);

    expect(auditSql.text).toBe(
      'insert into audit (uder_id, ip) values ((select id from user where login = $1), $2)',
    );
    expect(auditSql.values.length).toBe(2);
    expect(auditSql.values[0]).toBe(login);
    expect(auditSql.values[1]).toBe(ip);
  });

  it('transform name', () => {
    const q = sql.transform('name', 'test "identifier"') as object;
    expect(q.toString()).toBe('"test ""identifier"""');
  });

  it('parse with transform', () => {
    const table = 'address';
    const q = sql`select * from $name${table}`;
    expect(q.text).toBe('select * from "address"');
    expect(q.values.length).toBe(0);
  });

  it('parse with raw transform', () => {
    const table = 'address';
    const q = sql`select * from $!${table}`;
    expect(q.text).toBe('select * from address');
    expect(q.values.length).toBe(0);
  });

  it('parse with insert_object transform', () => {
    const data = {
      id: 123,
      val: 'abc',
    };
    const q = sql`INSERT INTO t $insert_object${data}`;
    expect(q.text).toBe('INSERT INTO t ("id","val") VALUES ($1,$2)');
    expect(q.values.length).toBe(2);
    expect(q.values[0]).toBe(123);
    expect(q.values[1]).toBe('abc');
  });

  it('SQL not nesting if ensuring SQL', () => {
    const sql1 = sql`${'Value'}`;
    const sql2 = sql(sql1);
    expect(sql1).toBe(sql2);
  });

  it('SQL literal custom SQL transform', () => {
    const val = {
      toSQL() {
        return 'DEFAULT';
      },
    };
    const q = sql`insert... ($${val})`;
    expect(q.text).toBe('insert... (DEFAULT)');
    expect(q.values.length).toBe(0);
    expect(q.toString()).toBe('insert... (DEFAULT)');
  });
});

describe('sql tag throws', () => {
  it('on unknown transform', () => {
    expect(() => sql`SELECT * FROM $bleh${'something'}`).toThrow();
  });

  it('on empty string', () => {
    expect(() => sql`SELECT * FROM $ID${''}`).toThrow();
  });

  it('on invalid input', () => {
    expect(() => sql(1 as any)).toThrow();
    expect(() => sql(1 as any, 2 as any)).toThrow();
  });

  it('on nonstring raw transform', () => {
    expect(() => sql`SELECT * FROM $RAW${null}`).toThrow();
  });

  it('on re-registering transform', () => {
    expect(() => {
      sql.registerTransform('Id', (val: unknown) => sql(val as string));
    }).toThrow();
  });

  it('on registering nonfunction transform', () => {
    expect(() => {
      sql.registerTransform('dummy', null as any);
    }).toThrow();
  });

  it('on passing undefined', () => {
    expect(() => sql`update mytable set myvalue = ${undefined}`).toThrow();
  });

  it('on transforming undefined', () => {
    const undef = undefined;
    expect(() => sql`SELECT * FROM $ID${undef}`).toThrow();
    expect(() => sql`SELECT * FROM $${undef}`).toThrow();
    // expect(() => literal(undef)).toThrow();
  });

  it('with invalid insert transform', () => {
    const data = [
      {
        id: 123,
        val: 'abc',
      },
    ];
    expect(() => sql`INSERT INTO t $insert${data}`).toThrow();
  });
});
