import { Client } from 'pg';
import { prepareValue } from 'pg/lib/utils';
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
      return new SqlFragment([escapeLiteral((value as any).toPostgres(prepareValue))], []);
    }

    if (typeof (value as any).toSQL === 'function') {
      const shouldBeSql = (value as any).toSQL();
      if (shouldBeSql instanceof SqlFragment) {
        return shouldBeSql;
      } else {
        return new SqlFragment([shouldBeSql], []);
      }
    }
  }

  return new SqlFragment([escapeLiteral((value as any).toString())], []);
}

registerTransform('', 'literal', literal);
