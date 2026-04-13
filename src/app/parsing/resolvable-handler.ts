import {Resolvable} from './ecore-model/resolvable';

export class ResolvableHandler {

  static create(raw: string|null): Resolvable | undefined {
    return raw? {raw: raw} : undefined;
  }

  static createNonNull(raw: string): Resolvable {
    return {raw: raw} as Resolvable;
  }

  static resolve(resolvable: Resolvable): string | undefined {
    return resolvable.resolved!!
  }
}
