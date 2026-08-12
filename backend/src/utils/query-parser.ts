import { Prisma } from "../generated/prisma/client.js";

interface Condition {
  field: string;
  value: string;
}

function parseCondition(token: string): Condition | null {
  const trimmed = token.trim();
  if (!trimmed) return null;

  const colonIndex = trimmed.indexOf(':');
  if (colonIndex === -1) {
    return { field: 'message', value: trimmed };
  }

  const field = trimmed.slice(0, colonIndex).trim();
  const value = trimmed.slice(colonIndex + 1).trim().replace(/^"|"$/g, '');
  return { field, value };
}

const VALID_SEVERITIES = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];

function conditionToSql(cond: Condition): Prisma.Sql | null {
  if (cond.field === 'message') {
    return Prisma.sql`message ILIKE ${'%' + cond.value + '%'}`;
  }

  if (cond.field === 'severity') {
    const value = cond.value.toUpperCase();
    if (!VALID_SEVERITIES.includes(value)) return null;
    return Prisma.sql`severity = ${value}::"Severity"`;
  }

  if (cond.field === 'service') {
    return Prisma.sql`service = ${cond.value}`;
  }

  if (cond.field === 'hostname') {
    return Prisma.sql`hostname = ${cond.value}`;
  }

  // Dot-notation nested path, e.g. user.id -> attributes #>> '{user,id}'
  if (cond.field.includes('.')) {
    const path = cond.field.split('.');
    return Prisma.sql`attributes #>> ${path} = ${cond.value}`;
  }

  // Flat attribute key, e.g. method:GET, status:404
  return Prisma.sql`attributes->>${cond.field} = ${cond.value}`;
}

export function parseQuery(query: string): Prisma.Sql | null {
  if (!query || !query.trim()) return null;

  const orGroups = query.split(/\s+OR\s+/i);
  const groupSqls: Prisma.Sql[] = [];

  for (const group of orGroups) {
    const andTokens = group.split(/\s+AND\s+/i);
    const condSqls: Prisma.Sql[] = [];

    for (const token of andTokens) {
      const cond = parseCondition(token);
      if (cond) {
        const sql = conditionToSql(cond);
        if (sql) condSqls.push(sql);
      }
    }

    if (condSqls.length > 0) {
      groupSqls.push(Prisma.sql`(${Prisma.join(condSqls, ' AND ')})`);
    }
  }

  if (groupSqls.length === 0) return null;

  return Prisma.sql`(${Prisma.join(groupSqls, ' OR ')})`;
}