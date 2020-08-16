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

export const mapObject = <T>(object: Record<string, T>, callback: any): Record<string, T> => {
  const result: Record<string, T> = {};
  forEachObject(object, (key: string, value: T) => (result[key] = callback(key, value)));
  return result;
};

export const now = () => {
  const today = new Date();
  const date = [today.getFullYear(), today.getMonth() + 1, today.getDate()].join('-');
  const time = [today.getHours(), today.getMinutes(), today.getSeconds()].join(':');
  return `${date} ${time}`;
};
