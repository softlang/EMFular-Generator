import {Resolvable} from './ecore-json';

export class ResolvableHandler {

  static create(raw: string|null): Resolvable | undefined {
    return raw? {raw: raw} : undefined;
  }

  static resolve(resolvable: Resolvable): string | undefined {
    return resolvable.resolved!!
  }
}
