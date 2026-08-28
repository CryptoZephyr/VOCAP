export interface RuntimeSchemaPrivileges {
  can_create: boolean;
  can_use: boolean;
}

export interface RuntimeTablePrivileges {
  table_name: string;
  can_select: boolean;
  can_insert: boolean;
  can_update: boolean;
  can_delete: boolean;
  can_truncate: boolean;
  can_references: boolean;
  can_trigger: boolean;
}

export function assertRuntimePrivileges(
  schema: RuntimeSchemaPrivileges | undefined,
  tables: readonly RuntimeTablePrivileges[],
): void {
  if (!schema?.can_use) throw new Error("runtime database role lacks USAGE on public schema");
  if (schema.can_create) throw new Error("runtime database role must not have CREATE on public schema");
  if (tables.length === 0) throw new Error("VOCAP database schema is missing");

  for (const table of tables) {
    if (!table.can_select || !table.can_insert || !table.can_update) {
      throw new Error(`runtime database role lacks required DML on ${table.table_name}`);
    }
    if (
      table.can_delete ||
      table.can_truncate ||
      table.can_references ||
      table.can_trigger
    ) {
      throw new Error(`runtime database role has excessive privileges on ${table.table_name}`);
    }
  }
}
