import { DEFAULT, NULL, SqlFragment, SqlValue } from './sql-fragment';
import { registerTransform, transform } from './transform/transform';

export function sql(source: string | SqlFragment): SqlFragment;
export function sql(
  templateParts: TemplateStringsArray,
  ...templateValues: SqlValue[]
): SqlFragment;
export function sql(
  templateParts: TemplateStringsArray | string | SqlFragment,
  ...templateValues: SqlValue[]
): SqlFragment {
  const argCount = templateValues.length;

  if (argCount === 0) {
    if (typeof templateParts === 'string') {
      return new SqlFragment([templateParts], []);
    }
    if (templateParts instanceof SqlFragment) {
      return templateParts;
    }
    if (Array.isArray(templateParts) && templateParts.length === 1) {
      return new SqlFragment(templateParts, []);
    }

    throw new Error('Invalid use of sql()');
  }

  if (!Array.isArray(templateParts)) {
    throw new Error('Invalid use of sql()');
  }

  const _templateParts: string[] = [];
  const values: SqlValue[] = [];

  const text: string[] = [];
  let currentFragment: string[] = [];
  let argIndex = 1;

  let i = 0;

  const addText = (str: string) => {
    currentFragment.push(str);
  };

  const flushText = () => {
    const fragment = currentFragment.join('');
    currentFragment = [];
    _templateParts.push(fragment);
    text.push(fragment);
  };

  const addValue = (value: SqlValue) => {
    flushText();
    values.push(value);
    text.push(`$${argIndex++}`);
  };

  while (i < argCount) {
    // tslint:disable-next-line:no-unsafe-any
    const parts: string[] = templateParts[i].split('$');
    let value: SqlValue = templateValues.shift();
    if (typeof value === 'undefined') {
      throw new Error(
        `Expected something, but got undefined. ` +
          `Value after SQL fragment: ${text.join('')}${templateParts[i]}`,
      );
    }

    // apply transforms from right to left
    while (parts.length > 1) value = transform(parts.pop() as string, value);

    addText(parts[0]);

    // TODO
    // tslint:disable-next-line
    if (value && typeof (value as any).toSQL === 'function') value = (value as any).toSQL();

    if (value instanceof SqlFragment) {
      const nestedValuesLength = value.values.length;
      let valueIndex = 0;
      while (valueIndex < nestedValuesLength) {
        addText(value._templateParts[valueIndex]);
        addValue(value.values[valueIndex]);
        valueIndex++;
      }
      addText(value._templateParts[valueIndex]);
    } else {
      addValue(value);
    }
    i++;
  }
  // last part is alone, without value
  addText(templateParts[i]); // tslint:disable-line:no-unsafe-any
  flushText();

  // this.text = text.join('');

  return new SqlFragment(_templateParts, values);
}

sql.NULL = NULL;
sql.DEFAULT = DEFAULT;

sql.transform = transform;
sql.registerTransform = registerTransform;
