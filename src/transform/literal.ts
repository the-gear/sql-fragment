import { Client } from 'pg';
import { prepareValue } from 'pg/lib/utils';
import { sql } from '../sql';
import { NULL, SqlFragment } from '../sql-fragment';
import { registerTransform } from './transform';

export const escapeLiteral = Client.prototype.escapeLiteral;

// returns quoted literal
export function literal(value: unknown): SqlFragment {
  // tslint:disable:no-any
  // tslint:disable:no-unsafe-any

  if (value instanceof SqlFragment) return value;

  if (typeof value === 'undefined') throw new Error(`Expected something, but got undefined.`);

  if (typeof value === 'object') {
    if (value === null) return NULL;

    if (typeof (value as any).toPostgres === 'function') {
      return sql(escapeLiteral((value as any).toPostgres(prepareValue)));
    }

    if (typeof (value as any).toSQL === 'function') return sql((value as any).toSQL());
  }

  return sql(escapeLiteral((value as any).toString()));
}

registerTransform('', 'literal', literal);
