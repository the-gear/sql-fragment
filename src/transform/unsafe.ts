import { sql } from '../sql';
import { SqlFragment } from '../sql-fragment';
import { registerTransform } from './transform';

export function sqlStr(str: unknown): SqlFragment {
  if (typeof str !== 'string') throw new Error(`Expected string, got "${str}"`);

  return sql(str);
}

registerTransform('unsafe', '!', 'raw', sqlStr);
