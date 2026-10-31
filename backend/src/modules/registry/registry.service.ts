import { sql } from "drizzle-orm";
import { createClient } from "../../db/client.js";
import type { IdentifierType } from "../identifiers/identifier.types.js";

type DatabaseClient = ReturnType<typeof createClient>;

export interface VerifiedRegistryEntry {
  identifierType: IdentifierType;
  normalizedValue: string;
  label: string;
}

export async function findVerifiedIdentifier(
  client: DatabaseClient,
  identifierType: IdentifierType,
  normalizedValue: string,
): Promise<VerifiedRegistryEntry | null> {
  const [row] = await client.db.execute(sql`
    SELECT i.identifier_type, i.normalized_value, v.label
    FROM verified_identifiers v
    JOIN identifiers i ON i.id = v.identifier_id
    WHERE i.identifier_type = ${identifierType}
      AND i.normalized_value = ${normalizedValue}
    LIMIT 1
  `);

  if (!row) return null;
  const result = row as {
    identifier_type: IdentifierType;
    normalized_value: string;
    label: string;
  };
  return {
    identifierType: result.identifier_type,
    normalizedValue: result.normalized_value,
    label: result.label,
  };
}

export async function listVerifiedIdentifiers(client: DatabaseClient): Promise<VerifiedRegistryEntry[]> {
  const rows = await client.db.execute(sql`
    SELECT i.identifier_type, i.normalized_value, v.label
    FROM verified_identifiers v
    JOIN identifiers i ON i.id = v.identifier_id
    ORDER BY i.identifier_type, i.normalized_value
  `);
  return (rows as unknown as Array<{
    identifier_type: IdentifierType;
    normalized_value: string;
    label: string;
  }>).map((row) => ({
    identifierType: row.identifier_type,
    normalizedValue: row.normalized_value,
    label: row.label,
  }));
}
