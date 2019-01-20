import { Client } from 'pg';
import { sql } from '../sql';
import { registerTransform } from './transform';

export const escapeIdentifier = Client.prototype.escapeIdentifier;

// returns quoted identifier
export function identifier(name: unknown) {
  if (typeof name !== 'string' || name === '') {
    throw new Error(`Expected nonempty string, got "${name}"`);
  }

  return sql(escapeIdentifier(name));
}

registerTransform('id', 'ident', 'identifier', 'name', identifier);
