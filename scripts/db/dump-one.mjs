import { writeFileSync } from 'fs';
import pg from 'pg';
const c = new pg.Client({ host:'aws-1-us-east-1.pooler.supabase.com', port:5432,
  user:'postgres.jitzwwxsnpylaistotgq', password:process.env.SUPABASE_DB_PASSWORD,
  database:'postgres', ssl:{rejectUnauthorized:false} });
await c.connect();
const r = await c.query(`SELECT name, statements FROM supabase_migrations.schema_migrations WHERE version=$1`, [process.argv[2]]);
const sql = (r.rows[0]?.statements ?? []).join(';\n\n');
writeFileSync(process.argv[3], sql.endsWith(';') ? sql : sql + ';\n');
console.log('name:', r.rows[0]?.name, '| bytes:', sql.length);
await c.end();
