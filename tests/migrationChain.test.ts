import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd());
const manifest = JSON.parse(
  readFileSync(resolve(root, "supabase-migration-order.json"), "utf8")
) as string[];

type Schema = Map<string, Set<string>>;

function matchingParen(source: string, openAt: number) {
  let depth = 0;
  for (let index = openAt; index < source.length; index += 1) {
    if (source[index] === "(") depth += 1;
    if (source[index] === ")") depth -= 1;
    if (depth === 0) return index;
  }
  throw new Error(`Unclosed parenthesis at offset ${openAt}`);
}

function addCreateTables(sql: string, schema: Schema) {
  const tablePattern = /create\s+table\s+if\s+not\s+exists\s+public\.([a-z_][a-z0-9_]*)\s*\(/gi;
  for (const match of sql.matchAll(tablePattern)) {
    const table = match[1].toLowerCase();
    const openAt = (match.index ?? 0) + match[0].lastIndexOf("(");
    const closeAt = matchingParen(sql, openAt);
    const columns = schema.get(table) ?? new Set<string>();

    for (const line of sql.slice(openAt + 1, closeAt).split(/\r?\n/)) {
      const column = line.trim().match(/^([a-z_][a-z0-9_]*)\s+/i)?.[1]?.toLowerCase();
      if (column && !["constraint", "check", "unique", "primary", "foreign"].includes(column)) {
        columns.add(column);
      }
    }
    schema.set(table, columns);
  }
}

function addAlterColumns(sql: string, schema: Schema) {
  const alterPattern = /alter\s+table\s+(?:if\s+exists\s+)?public\.([a-z_][a-z0-9_]*)([\s\S]*?);/gi;
  for (const match of sql.matchAll(alterPattern)) {
    const table = match[1].toLowerCase();
    const columns = schema.get(table);
    if (!columns) continue;
    for (const addition of match[2].matchAll(/add\s+column\s+if\s+not\s+exists\s+([a-z_][a-z0-9_]*)/gi)) {
      columns.add(addition[1].toLowerCase());
    }
  }
}

function schemaFrom(sqlFiles: string[]) {
  const schema: Schema = new Map();
  for (const sql of sqlFiles) addCreateTables(sql, schema);
  for (const sql of sqlFiles) addAlterColumns(sql, schema);
  return schema;
}

function indexDefinitions(sql: string) {
  const definitions: Array<{ name: string; table: string; columns: string[] }> = [];
  const pattern = /create\s+(?:unique\s+)?index\s+if\s+not\s+exists\s+([a-z_][a-z0-9_]*)\s+on\s+public\.([a-z_][a-z0-9_]*)\s*\(/gi;
  for (const match of sql.matchAll(pattern)) {
    const openAt = (match.index ?? 0) + match[0].lastIndexOf("(");
    const closeAt = matchingParen(sql, openAt);
    const expressions = sql.slice(openAt + 1, closeAt).split(",");
    const columns = expressions.flatMap((expression) => {
      const normalized = expression.trim().replace(/\s+(asc|desc)(\s+nulls\s+(first|last))?$/i, "");
      const functionColumn = normalized.match(/^[a-z_][a-z0-9_]*\s*\(\s*([a-z_][a-z0-9_]*)/i)?.[1];
      const plainColumn = normalized.match(/^([a-z_][a-z0-9_]*)/i)?.[1];
      return functionColumn ? [functionColumn.toLowerCase()] : plainColumn ? [plainColumn.toLowerCase()] : [];
    });
    definitions.push({ name: match[1], table: match[2].toLowerCase(), columns });
  }
  return definitions;
}

describe("Supabase migration chain", () => {
  const sqlFiles = manifest.map((file) => readFileSync(resolve(root, file), "utf8"));
  const combinedSql = sqlFiles.join("\n");
  const schema = schemaFrom(sqlFiles);

  it("lists every root migration exactly once", () => {
    const diskMigrations = readdirSync(root).filter((file) => /^supabase-.*\.sql$/.test(file)).sort();
    expect([...manifest].sort()).toEqual(diskMigrations);
    expect(new Set(manifest).size).toBe(manifest.length);
    expect(manifest.every((file) => existsSync(resolve(root, file)))).toBe(true);
  });

  it("keeps dependency-sensitive migrations in deployable order", () => {
    const before = (dependency: string, dependent: string) =>
      expect(manifest.indexOf(dependency), `${dependency} must run before ${dependent}`).toBeLessThan(manifest.indexOf(dependent));

    before("supabase-schema.sql", "supabase-auth-user-sync.sql");
    before("supabase-schema.sql", "supabase-employer-subscriptions.sql");
    before("supabase-employer-subscriptions.sql", "supabase-manual-subscription-payments.sql");
    before("supabase-support-system.sql", "supabase-live-chat-system.sql");
    before("supabase-live-chat-system.sql", "supabase-support-operations-center.sql");
    before("supabase-enterprise-recruitment-workflow.sql", "supabase-talent-crm.sql");
    before("supabase-talent-crm.sql", "supabase-talent-crm-stabilization.sql");
    before("supabase-talent-crm-stabilization.sql", "supabase-performance-indexes.sql");
    before("supabase-talent-crm.sql", "supabase-platform-hardening.sql");
  });

  it("only creates indexes on existing public table columns", () => {
    const invalid = indexDefinitions(combinedSql).flatMap((index) => {
      const tableColumns = schema.get(index.table);
      if (!tableColumns) return [`${index.name}: missing table public.${index.table}`];
      return index.columns
        .filter((column) => !tableColumns.has(column))
        .map((column) => `${index.name}: missing public.${index.table}.${column}`);
    });
    expect(invalid).toEqual([]);
  });

  it("only references existing public foreign-key targets", () => {
    const invalid = [...combinedSql.matchAll(/references\s+public\.([a-z_][a-z0-9_]*)\s*\(\s*([a-z_][a-z0-9_]*)\s*\)/gi)]
      .flatMap((match) => {
        const table = match[1].toLowerCase();
        const column = match[2].toLowerCase();
        const columns = schema.get(table);
        return columns?.has(column) ? [] : [`public.${table}(${column})`];
      });
    expect(invalid).toEqual([]);
  });

  it("only attaches policies and triggers to existing public tables", () => {
    const policyTables = [...combinedSql.matchAll(/(?:create|drop)\s+policy[\s\S]*?\s+on\s+public\.([a-z_][a-z0-9_]*)/gi)]
      .map((match) => match[1].toLowerCase());
    const triggerTables = [...combinedSql.matchAll(/create\s+trigger[\s\S]*?\s+on\s+public\.([a-z_][a-z0-9_]*)/gi)]
      .map((match) => match[1].toLowerCase());
    expect([...policyTables, ...triggerTables].filter((table) => !schema.has(table))).toEqual([]);
  });

  it("defines every custom trigger function before use", () => {
    const functions = new Set(
      [...combinedSql.matchAll(/create\s+or\s+replace\s+function\s+public\.([a-z_][a-z0-9_]*)/gi)]
        .map((match) => match[1].toLowerCase())
    );
    const invoked = [...combinedSql.matchAll(/execute\s+function\s+public\.([a-z_][a-z0-9_]*)/gi)]
      .map((match) => match[1].toLowerCase());
    expect(invoked.filter((name) => !functions.has(name))).toEqual([]);
  });

  it("preserves the canonical ownership and support columns", () => {
    expect(schema.get("jobs")).toContain("employer_id");
    expect(schema.get("jobs")).not.toContain("employer_user_id");
    expect(schema.get("applications")).toContain("employer_user_id");
    expect(schema.get("recruitment_offers")).toContain("employer_user_id");
    expect(schema.get("recruitment_communications")).toContain("application_id");
    for (const column of ["user_id", "avatar_url", "role", "status", "is_active"]) {
      expect(schema.get("employees"), `public.employees.${column}`).toContain(column);
    }
  });

  it("keeps Talent CRM upgrades idempotent and security scoped", () => {
    const crm = readFileSync(resolve(root, "supabase-talent-crm.sql"), "utf8");
    const stabilization = readFileSync(resolve(root, "supabase-talent-crm-stabilization.sql"), "utf8");
    expect((crm.match(/create table if not exists public\./gi) || []).length).toBeGreaterThanOrEqual(12);
    expect(stabilization).toContain("create or replace function public.crm_touch_updated_at()");
    expect(stabilization).toContain("create policy career_pages_public_read");
    expect(stabilization).toContain("create policy career_pages_workspace_access");
    expect(stabilization).toContain("create or replace function public.crm_schema_health()");
    expect(stabilization).toContain("create or replace function public.crm_talent_metrics(target_owner uuid)");
    expect(stabilization).not.toMatch(/create\s+table\s+(?!if not exists)/i);
  });
});
