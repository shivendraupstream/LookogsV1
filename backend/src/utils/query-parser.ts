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

function conditionToSql(cond: Condition): Prisma.Sql {
  if (cond.field === 'message') {
    return Prisma.sql`message ILIKE ${'%' + cond.value + '%'}`;
  }
  if (cond.field === 'severity') {
    return Prisma.sql`severity = ${cond.value.toUpperCase()}::"Severity"`;
  }
  if (cond.field === 'service') {
    return Prisma.sql`service = ${cond.value}`;
  }
  if (cond.field === 'hostname') {
    return Prisma.sql`hostname = ${cond.value}`;
  }
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
      if (cond) condSqls.push(conditionToSql(cond));
    }

    if (condSqls.length > 0) {
      groupSqls.push(Prisma.sql`(${Prisma.join(condSqls, ' AND ')})`);
    }
  }

  if (groupSqls.length === 0) return null;

  return Prisma.sql`(${Prisma.join(groupSqls, ' OR ')})`;
}