import { Injectable } from '@angular/core';
import {EPackageJson} from '../parsing-model/package';
import {Package} from '../generation-model/package';
import {ReferenceResolvingService} from './reference-resolving/reference-resolving.service';
import {EClassJson, EDataTypeJson, EEnumJson} from '../parsing-model/classifier';
import {EClass, EDataType, EEnum, SuperTypes} from '../generation-model/classifier';
import {TypeResolvingService} from './type-resolving.service';
import {AttributeResolver} from './attribute-resolver';

@Injectable({
  providedIn: 'root',
})
export class Parsing2GenerationService {

  constructor(
    private referenceResolvingService: ReferenceResolvingService,
    private typeResolvingService: TypeResolvingService,
    private attributeResolver: AttributeResolver,
  ) {}

  transform(pkgs: EPackageJson[]): Package[] {
    return pkgs.flatMap(p => this.transformOne(p, []))
  }

  transformOne(pkg: EPackageJson, path: string[]): Package[] {
    const res: Package[] = (pkg.subPackages??[]).flatMap(
      p => this.transformOne(p, path.concat(pkg.pascalizedName))
    )
    const pkgT: Package = {
      nsPrefix: pkg.nsPrefix,
      nsURI: pkg.nsURI,
      path: path,
      classes: pkg.eClasses.map(cls => this.transformClass(cls)),
      datatypes: pkg.eDataTypes.map(dt => this.transformDataType(dt)),
      enums: pkg.eEnums.map(ee => this.transformEnum(ee)),
    }
    res.push(pkgT)
    return res
  }

  transformEnum(eenum: EEnumJson): EEnum {
    return {
      name: eenum.name,
      literals: eenum.literals,
    }
  }

  transformDataType(eDataType: EDataTypeJson): EDataType {
    return {
      name: eDataType.name,
      aliasedType: this.typeResolvingService.resolveType(eDataType.instanceTypeName),
    }
  }

  transformClass(cls: EClassJson): EClass {
    const superTypes: SuperTypes = {
      interfaces: [],
      realParent: undefined
    } //todo
    return {
      name: cls.name,
      abstract: cls.abstract,
      interfaceLike: cls.interfaceLike,
      attributes: [], //todo
      references: [], //todo
      superTypes: superTypes
    }
  }
}
