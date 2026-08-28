import { describe, expect, it } from "vitest";
import { assertRuntimePrivileges, type RuntimeTablePrivileges } from "../src/runtime-role.js";

const validTable: RuntimeTablePrivileges = {
  table_name: "vocap_sync_cursors",
  can_select: true,
  can_insert: true,
  can_update: true,
  can_delete: false,
  can_truncate: false,
  can_references: false,
  can_trigger: false,
};

describe("runtime database privileges", () => {
  it("accepts the least-privilege application role", () => {
    expect(() =>
      assertRuntimePrivileges({ can_create: false, can_use: true }, [validTable]),
    ).not.toThrow();
  });

  it("rejects schema creation and destructive table privileges", () => {
    expect(() =>
      assertRuntimePrivileges({ can_create: true, can_use: true }, [validTable]),
    ).toThrow("must not have CREATE");

    expect(() =>
      assertRuntimePrivileges(
        { can_create: false, can_use: true },
        [{ ...validTable, can_delete: true }],
      ),
    ).toThrow("excessive privileges");
  });

  it("rejects missing schema and required DML", () => {
    expect(() =>
      assertRuntimePrivileges({ can_create: false, can_use: false }, [validTable]),
    ).toThrow("lacks USAGE");
    expect(() =>
      assertRuntimePrivileges(
        { can_create: false, can_use: true },
        [{ ...validTable, can_update: false }],
      ),
    ).toThrow("lacks required DML");
    expect(() =>
      assertRuntimePrivileges({ can_create: false, can_use: true }, []),
    ).toThrow("schema is missing");
  });
});
