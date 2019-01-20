import { Client } from 'pg';
import { SqlFragment } from '../sql-fragment';
import { registerTransform } from './transform';

export const escapeIdentifier = Client.prototype.escapeIdentifier;

// returns quoted identifier
export function identifier(name: unknown) {
  if (typeof name !== 'string' || name === '') {
    throw new Error(`Expected nonempty string, got "${name}"`);
  }

  return new SqlFragment([escapeIdentifier(name)], []);
}

registerTransform('id', 'ident', 'identifier', 'name', identifier);
