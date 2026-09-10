import assert from "node:assert/strict";
import { test } from "node:test";
import * as drizzleSchema from "@repo/db/drizzle-schema-auth";
import { getAuthTables } from "better-auth/db";
import { getColumns, is, Table } from "drizzle-orm";

import { auth } from "./auth";

// Keep the hand-maintained schema aligned with better-auth's runtime contract.
const drizzleTables = new Map<string, Table>();
for (const [key, value] of Object.entries(drizzleSchema)) {
  if (is(value, Table)) {
    drizzleTables.set(key, value);
  }
}

for (const [key, authTable] of Object.entries(getAuthTables(auth.options))) {
  test(`${key} matches better-auth's table contract`, () => {
    const table = drizzleTables.get(authTable.modelName);
    assert.ok(table, `Missing Drizzle export: ${authTable.modelName}`);
    const columns = getColumns(table);
    const fields = Object.entries(authTable.fields);
    const expected = fields.map(([fieldKey, field]) => field.fieldName ?? fieldKey);
    assert.deepEqual(Object.keys(columns).toSorted(), [...expected, "id"].toSorted());
    for (const [fieldKey, field] of fields) {
      const name = field.fieldName ?? fieldKey;
      assert.equal(columns[name]?.notNull, field.required === true, `${name}: nullability`);
    }
  });
}
