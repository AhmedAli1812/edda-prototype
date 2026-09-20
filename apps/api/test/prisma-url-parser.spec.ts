import { parseDatabaseUrl } from '../src/modules/prisma/prisma.service';

describe('parseDatabaseUrl - DATABASE_URL credentials parsing', () => {
  it('correctly decodes URL-encoded username and password with special characters', () => {
    const rawUrl = 'mysql://user%40domain.com:p%40ss%23w%24rd%25123@sql.hostinger.com:3307/u123_edda_db';
    const config = parseDatabaseUrl(rawUrl);

    expect(config.host).toBe('sql.hostinger.com');
    expect(config.port).toBe(3307);
    expect(config.user).toBe('user@domain.com');
    expect(config.password).toBe('p@ss#w$rd%123');
    expect(config.database).toBe('u123_edda_db');
  });

  it('defaults port to 3306 when omitted in DATABASE_URL', () => {
    const rawUrl = 'mysql://edda_user:secret_pass@127.0.0.1/edda';
    const config = parseDatabaseUrl(rawUrl);

    expect(config.host).toBe('127.0.0.1');
    expect(config.port).toBe(3306);
    expect(config.user).toBe('edda_user');
    expect(config.password).toBe('secret_pass');
    expect(config.database).toBe('edda');
  });

  it('handles optional query parameters like connectionLimit, connectTimeout, ssl', () => {
    const rawUrl = 'mysql://u:p@db:3306/db?connection_limit=15&connect_timeout=5000&ssl=true';
    const config = parseDatabaseUrl(rawUrl);

    expect(config.connectionLimit).toBe(15);
    expect(config.connectTimeout).toBe(5000);
    expect(config.ssl).toBe(true);
  });

  it('handles DATABASE_URL with encoded database name', () => {
    const rawUrl = 'mysql://root:pass@localhost:3306/my%20test%20db';
    const config = parseDatabaseUrl(rawUrl);

    expect(config.database).toBe('my test db');
  });
});
