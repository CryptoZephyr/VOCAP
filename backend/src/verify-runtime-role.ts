import { Pool } from "pg";
import {
  assertRuntimePrivileges,
  type RuntimeSchemaPrivileges,
  type RuntimeTablePrivileges,
} from "./runtime-role.js";

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required for runtime role verification");

  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const schemaPrivilege = await pool.query<RuntimeSchemaPrivileges>(
      `
        SELECT
          has_schema_privilege(current_user, 'public', 'CREATE') AS can_create,
          has_schema_privilege(current_user, 'public', 'USAGE') AS can_use
      `,
    );
    const privileges = await pool.query<RuntimeTablePrivileges>(
      `
        SELECT
          table_name,
          has_table_privilege(current_user, format('%I.%I', table_schema, table_name), 'SELECT') AS can_select,
          has_table_privilege(current_user, format('%I.%I', table_schema, table_name), 'INSERT') AS can_insert,
          has_table_privilege(current_user, format('%I.%I', table_schema, table_name), 'UPDATE') AS can_update,
          has_table_privilege(current_user, format('%I.%I', table_schema, table_name), 'DELETE') AS can_delete,
          has_table_privilege(current_user, format('%I.%I', table_schema, table_name), 'TRUNCATE') AS can_truncate,
          has_table_privilege(current_user, format('%I.%I', table_schema, table_name), 'REFERENCES') AS can_references,
          has_table_privilege(current_user, format('%I.%I', table_schema, table_name), 'TRIGGER') AS can_trigger
        FROM information_schema.tables
        WHERE table_schema = 'public' AND left(table_name, 6) = 'vocap_'
        ORDER BY table_name
      `,
    );
    assertRuntimePrivileges(schemaPrivilege.rows[0], privileges.rows);

    process.stdout.write(`VOCAP runtime database privileges verified for ${privileges.rows.length} tables\n`);
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`VOCAP runtime database privilege check failed: ${message}\n`);
  process.exitCode = 1;
});
