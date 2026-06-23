import {Injectable} from '@angular/core';
import {AttributeTargetTypes, TypeReference} from '../generation-model/cross-references';

@Injectable({
  providedIn: 'root',
})
export class TypeResolvingService {

  resolveType(raw: string): TypeReference {
    //todo
    return {
      reference: {isBuiltIn: true, name: "todo"},
      target: AttributeTargetTypes.any
    }
  }
}
