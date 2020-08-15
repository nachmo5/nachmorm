import { FlatField } from './typings';

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

    return [...acc, { value, alias: renderAlias(currentPath, value), path: currentPath }];
  }, []);

export const forEachObject = (
  object: { [name: string]: any },
  callback = (key: string, value: any) => {}
) => Object.keys(object).map((key: string) => callback(key, object[key]));

export const reduceObject = (
  object: { [name: string]: any },
  callback = (acc: any, key: string, value: any) => {},
  init: any
) => Object.keys(object).reduce((acc, key) => callback(acc, key, object[key]), init);
