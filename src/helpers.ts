import { FlatField } from './interfaces/Helpers';

export const flattenObject = (
  object: { [key: string]: any },
  path: string[] = [],
  renderAlias = (path: string[], value: any) => value
): FlatField[] =>
  Object.keys(object).reduce((acc: FlatField[], key) => {
    const currentPath = [...path, key];
    const value = object[key];
    if (typeof value === 'object') {
      return [...acc, ...flattenObject(value, currentPath, renderAlias)];
    }

    return [
      ...acc,
      { value, alias: renderAlias(currentPath, value), path: currentPath },
    ];
  }, []);
