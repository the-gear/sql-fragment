import { QueryConfig } from 'pg';
import { literal } from './transform/literal';

export interface ConvertibleToSql {
  toSql(): SqlFragment;
}

export type SqlValue = SqlFragment | ConvertibleToSql | unknown;

export class SqlFragment implements Readonly<QueryConfig> {
  get text(): string {
    if (this._text !== null) {
      return this._text;
    }

    this.compile();

    return (this._text as unknown) as string;
  }

  name?: string;
  values: Array<unknown>;
  _templateParts: ReadonlyArray<string>;

  private _text: string | null = null;

  constructor(templateParts: ReadonlyArray<string>, values: SqlValue[], name?: string) {
    this._templateParts = templateParts;
    this.values = values;
    this.name = name;
  }

  // this is for log/debugging only
  toString(): string {
    const acc: string[] = [];
    let idx = 0;
    for (const part of this._templateParts) {
      acc.push(idx > 0 ? `${literal(this.values[idx - 1]).text}${part}` : part);
      idx++;
    }

    return acc.join('');
  }

  toJSON(): Readonly<QueryConfig> {
    return {
      name: this.name,
      text: this.text,
      values: this.values,
    };
  }

  private compile(): this {
    const acc: string[] = [];
    let idx = 0;
    for (const part of this._templateParts) {
      acc.push(idx > 0 ? `$${idx}${part}` : part);
      idx++;
    }
    this._text = acc.join('');

    return this;
  }
}

export const NULL = new SqlFragment(['NULL'], []);
export const DEFAULT = new SqlFragment(['DEFAULT'], []);
