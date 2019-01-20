import { SqlFragment } from '../sql-fragment';
import { escapeIdentifier } from './identifier';
import { registerTransform } from './transform';

export function insert(data: unknown): SqlFragment {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Data must be an object');
  }

  if (Array.isArray(data)) {
    throw new Error('Array is not supported');
  }

  const keys = Object.keys(data);
  const length = keys.length;
  const sqlFragments = new Array(length);
  const values = new Array(length - 1);
  const sb = [];

  sb.push('(');
  let i = 0;
  while (i < length) {
    const column = keys[i];
    // tslint:disable-next-line:no-any
    values[i] = (data as any)[column];
    i++;
    sb.push(escapeIdentifier(column), ',');
    sqlFragments[i] = ',';
  }
  sb[sb.length - 1] = ') VALUES (';
  sqlFragments[0] = sb.join('');
  sqlFragments[i] = ')';

  return new SqlFragment(sqlFragments, values);
}

registerTransform('insert_object', 'insert', insert);
