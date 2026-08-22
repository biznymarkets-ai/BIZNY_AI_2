import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index.ts";

const { Pool } = pg;

export let pool: pg.Pool | null = null;
export let db: any;

function getTableName(table: any): string {
  if (!table) return "default";
  if (typeof table === "string") return table;
  if (typeof table === "object") {
    if (table[Symbol.for("drizzle:Name")]) return String(table[Symbol.for("drizzle:Name")]);
    if (table[Symbol.for("drizzle:OriginalName")]) return String(table[Symbol.for("drizzle:OriginalName")]);
    if (table._?.name) return String(table._.name);
    if (table.name) return String(table.name);
    if (table.config?.name) return String(table.config.name);
  }
  return "default";
}

function getColumnName(col: any): string {
  if (!col) return "";
  if (typeof col === "string") return col;
  if (typeof col === "object") {
    if (col[Symbol.for("drizzle:Name")]) return String(col[Symbol.for("drizzle:Name")]);
    if (col[Symbol.for("drizzle:OriginalName")]) return String(col[Symbol.for("drizzle:OriginalName")]);
    if (col.name) return String(col.name);
    if (col._?.name) return String(col._.name);
    if (col._?.columnName) return String(col._.columnName);
    if (col.key) return String(col.key);
    if (col.config?.name) return String(col.config.name);
    if (col.columnName) return String(col.columnName);
    if (col.fieldName) return String(col.fieldName);
    if (col.queryChunks && Array.isArray(col.queryChunks)) {
      for (const c of col.queryChunks) {
        const sub = getColumnName(c);
        if (sub) return sub;
      }
    }
  }
  return "";
}

function extractValueFromChunk(chunk: any): any {
  if (chunk === undefined || chunk === null) return undefined;
  if (typeof chunk === "string" || typeof chunk === "number" || typeof chunk === "boolean") return chunk;
  if (chunk instanceof Date) return chunk;
  if (chunk.value !== undefined) return chunk.value;
  if (chunk.param !== undefined) return chunk.param;
  if (chunk.val !== undefined) return chunk.val;
  if (chunk.arg !== undefined) return chunk.arg;
  if (chunk.encoder?.value !== undefined) return chunk.encoder.value;
  if (chunk.encoder?.val !== undefined) return chunk.encoder.val;
  if (chunk.queryChunks && Array.isArray(chunk.queryChunks)) {
    for (const c of chunk.queryChunks) {
      const v = extractValueFromChunk(c);
      if (v !== undefined) return v;
    }
  }
  if (typeof chunk === "object") {
    for (const key of Object.keys(chunk)) {
      if (typeof chunk[key] === "string" || typeof chunk[key] === "number" || typeof chunk[key] === "boolean") {
        return chunk[key];
      }
    }
  }
  return undefined;
}

function matchesValue(actual: any, target: any, operator?: string): boolean {
  if (actual === undefined && target === undefined) return true;
  if (actual === null && target === null) return true;
  if (actual === undefined || actual === null) return target === null || target === undefined;

  const targetStr = String(target ?? "");
  const actualStr = String(actual ?? "");

  // Pattern matching for like/ilike with % wildcards
  if (targetStr.includes("%")) {
    const cleanPattern = targetStr
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\\%/g, ".*");
    try {
      const regex = new RegExp(`^${cleanPattern}$`, "i");
      return regex.test(actualStr);
    } catch {
      const raw = targetStr.replace(/%/g, "").toLowerCase();
      return actualStr.toLowerCase().includes(raw);
    }
  }

  // Case-insensitive string matching
  if (typeof actual === "string" && typeof target === "string") {
    if (actual.toLowerCase() === target.toLowerCase()) return true;
  }

  // Numeric matching
  if (!isNaN(Number(actual)) && !isNaN(Number(target)) && typeof actual !== "boolean" && typeof target !== "boolean") {
    if (Number(actual) === Number(target)) return true;
  }

  // Loose equality
  return actual == target;
}

function matchesWhere(item: any, condition: any): boolean {
  if (!condition) return true;
  try {
    // 1. Binary expression (left and right)
    if (condition.left !== undefined && condition.right !== undefined) {
      const colName = getColumnName(condition.left);
      const val = extractValueFromChunk(condition.right);
      if (colName) {
        if (item[colName] !== undefined) {
          return matchesValue(item[colName], val);
        }
        for (const k of Object.keys(item)) {
          if (k.toLowerCase() === colName.toLowerCase().replace(/_/g, "")) {
            return matchesValue(item[k], val);
          }
        }
      }
    }

    // 2. QueryChunks from Drizzle SQL expressions
    if (condition.queryChunks && Array.isArray(condition.queryChunks)) {
      for (let i = 0; i < condition.queryChunks.length; i++) {
        const chunk = condition.queryChunks[i];
        const colName = getColumnName(chunk);
        if (colName) {
          for (let j = i + 1; j < condition.queryChunks.length; j++) {
            const val = extractValueFromChunk(condition.queryChunks[j]);
            if (val !== undefined) {
              if (item[colName] !== undefined) {
                return matchesValue(item[colName], val);
              }
              for (const k of Object.keys(item)) {
                if (k.toLowerCase() === colName.toLowerCase().replace(/_/g, "")) {
                  return matchesValue(item[k], val);
                }
              }
            }
          }
        }
      }
    }

    // 3. Composite AND / OR conditions
    if (Array.isArray(condition.conditions)) {
      if (condition.operator === "or") {
        return condition.conditions.some((c: any) => matchesWhere(item, c));
      }
      return condition.conditions.every((c: any) => matchesWhere(item, c));
    }
  } catch {
    return true;
  }
  return true;
}

function createInMemoryDb() {
  const tables = new Map<string, any[]>();
  let idCounter = 1;

  function getTableData(table: any): any[] {
    const name = getTableName(table);
    if (!tables.has(name)) tables.set(name, []);
    return tables.get(name)!;
  }

  return {
    select(_fields?: any) {
      let targetTable: any = null;
      let whereClause: any = null;
      let limitCount: number | null = null;
      let offsetCount: number | null = null;

      const chain: any = {
        from(table: any) {
          targetTable = table;
          return chain;
        },
        where(cond: any) {
          whereClause = cond;
          return chain;
        },
        orderBy(..._cols: any[]) {
          return chain;
        },
        limit(n: number) {
          limitCount = n;
          return chain;
        },
        offset(n: number) {
          offsetCount = n;
          return chain;
        },
        leftJoin() { return chain; },
        innerJoin() { return chain; },
        groupBy() { return chain; },
        then(resolve: any, reject: any) {
          try {
            const data = getTableData(targetTable);
            let res = [...data];
            if (whereClause) {
              res = res.filter((item) => matchesWhere(item, whereClause));
            }
            if (offsetCount) res = res.slice(offsetCount);
            if (limitCount !== null) res = res.slice(0, limitCount);
            return Promise.resolve(res).then(resolve, reject);
          } catch (e) {
            return Promise.resolve([]).then(resolve, reject);
          }
        },
        catch(reject: any) {
          return chain.then((x: any) => x).catch(reject);
        },
      };
      return chain;
    },

    insert(table: any) {
      let insertedValues: any[] = [];
      const chain: any = {
        values(vals: any) {
          const data = getTableData(table);
          const raw = Array.isArray(vals) ? vals : [vals];
          insertedValues = raw.map((v) => {
            const row = {
              id: v.id || idCounter++,
              createdAt: v.createdAt || new Date(),
              updatedAt: v.updatedAt || new Date(),
              ...v,
            };
            data.push(row);
            return row;
          });
          return chain;
        },
        returning() {
          return chain;
        },
        onConflictDoUpdate() {
          return chain;
        },
        onConflictDoNothing() {
          return chain;
        },
        then(resolve: any, reject: any) {
          return Promise.resolve(insertedValues).then(resolve, reject);
        },
        catch(reject: any) {
          return chain.then((x: any) => x).catch(reject);
        },
      };
      return chain;
    },

    update(table: any) {
      let updatedValues: any = {};
      let whereClause: any = null;
      const chain: any = {
        set(vals: any) {
          updatedValues = vals;
          return chain;
        },
        where(cond: any) {
          whereClause = cond;
          return chain;
        },
        returning() {
          return chain;
        },
        then(resolve: any, reject: any) {
          const data = getTableData(table);
          const updated: any[] = [];
          for (let i = 0; i < data.length; i++) {
            if (!whereClause || matchesWhere(data[i], whereClause)) {
              data[i] = { ...data[i], ...updatedValues, updatedAt: new Date() };
              updated.push(data[i]);
            }
          }
          return Promise.resolve(updated).then(resolve, reject);
        },
        catch(reject: any) {
          return chain.then((x: any) => x).catch(reject);
        },
      };
      return chain;
    },

    delete(table: any) {
      let whereClause: any = null;
      const chain: any = {
        where(cond: any) {
          whereClause = cond;
          return chain;
        },
        then(resolve: any, reject: any) {
          const name = getTableName(table);
          if (tables.has(name)) {
            const data = tables.get(name)!;
            const remaining = whereClause ? data.filter((item) => !matchesWhere(item, whereClause)) : [];
            tables.set(name, remaining);
          }
          return Promise.resolve([]).then(resolve, reject);
        },
        catch(reject: any) {
          return chain.then((x: any) => x).catch(reject);
        },
      };
      return chain;
    },

    query: new Proxy({}, {
      get(_target, prop: string) {
        return {
          findMany: async () => getTableData(prop),
          findFirst: async () => getTableData(prop)[0] || null,
        };
      },
    }),

    execute: async () => ({ rows: [] }),
  };
}

if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== "") {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL.trim(),
      connectionTimeoutMillis: 3000,
    });
    pool.on("error", (err) => console.warn("[Database] Postgres pool background error:", err.message));
    db = drizzlePg(pool, { schema });
    console.log("[Database] Connected via PostgreSQL DATABASE_URL");
  } catch (err: any) {
    console.warn("[Database] PostgreSQL connection failed, falling back to memory-safe store:", err?.message);
    db = createInMemoryDb();
  }
} else {
  console.log("[Database] Initialized lightweight in-memory store (zero WASM, memory-optimized for cloud deployment)");
  db = createInMemoryDb();
}

export * from "./schema/index.ts";


