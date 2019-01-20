import { SqlFragment } from '../sql-fragment';
import { warn } from '../utils';

export type Transform = (value: unknown) => SqlFragment;

const transforms = new Map<string, Transform>();

export function registerTransform(name: string, transform: Transform): void;
export function registerTransform(name: string, name2: string, transform: Transform): void;
export function registerTransform(
  name: string,
  name2: string,
  name3: string,
  transform: Transform,
): void;
export function registerTransform(
  name: string,
  name2: string,
  name3: string,
  name4: string,
  transform: Transform,
): void;
export function registerTransform(
  name: string,
  name2: string,
  name3: string,
  name4: string,
  name5: string,
  transform: Transform,
): void;
export function registerTransform(...names: Array<string | Transform>): void {
  const transFn = names.pop();
  if (typeof transFn !== 'function') {
    throw new Error('Last argument must be a Transform function');
  }

  for (const name of names) {
    if (typeof name !== 'string') {
      throw new Error('Only last argument must be a Transform, preceding must be string');
    }

    const normalizedName = name.trim().toLowerCase();
    if (normalizedName !== name) {
      throw new Error(`Invalid transform name: '${name}'.`);
    }

    if (transforms.has(normalizedName)) {
      if (transforms.get(normalizedName) === transFn) {
        warn(`Same Transform ${name} already registered`);
      } else {
        throw new Error(`Different transform ${name} already registered`);
      }
    }
    transforms.set(normalizedName, transFn);
  }
}

export function transform(name: string, value: unknown): SqlFragment | unknown {
  const normalizedName = name.trim().toLowerCase();
  const transFn = transforms.get(normalizedName);
  if (!transFn) throw new Error(`Unknown transform: "${name}"`);

  return transFn(value);
}
