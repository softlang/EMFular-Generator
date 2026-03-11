import { Injectable } from '@angular/core';
import {
  EPackageJson,
  EClassJson,
  EAttributeJson,
  EReferenceJson,
  EEnumJson,
  EDataTypeJson,
} from './ecore-json';

@Injectable({
  providedIn: 'root',
})
export class Ecore2JsonService {

  parse(xml: string): EPackageJson {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    const root = doc.documentElement;

    if (!root.tagName.endsWith('EPackage')) {
      throw new Error('Root element is not an EPackage');
    }

    const pkg: EPackageJson = {
      name: root.getAttribute('name') ?? '',
      nsURI: root.getAttribute('nsURI') ?? '',
      nsPrefix: root.getAttribute('nsPrefix') ?? '',
      eClasses: [],
      eEnums: [],
      eDataTypes: [],
    };

    for (const child of Array.from(root.children)) {
      if (child.tagName === 'eClassifiers') {
        const type = child.getAttribute('xsi:type');

        if (type === 'ecore:EClass') {
          pkg.eClasses.push(this.parseEClass(child));
        } else if (type === 'ecore:EEnum') {
          pkg.eEnums.push(this.parseEEnum(child));
        } else if (type === 'ecore:EDataType') {
          pkg.eDataTypes.push(this.parseEDataType(child));
        }
      }
    }

    return pkg;
  }

  private parseEClass(el: Element): EClassJson {
    const cls: EClassJson = {
      kind: 'EClass',
      name: el.getAttribute('name') ?? '',
      abstract: el.getAttribute('abstract') === 'true',
      superTypes: (el.getAttribute('eSuperTypes') ?? '')
        .split(' ')
        .filter(Boolean),
      attributes: [],
      references: [],
    };

    for (const child of Array.from(el.children)) {
      const type = child.getAttribute('xsi:type');

      if (type === 'ecore:EAttribute') {
        cls.attributes.push(this.parseEAttribute(child));
      } else if (type === 'ecore:EReference') {
        cls.references.push(this.parseEReference(child));
      }
    }

    return cls;
  }

  private parseEAttribute(el: Element): EAttributeJson {
    return {
      kind: 'EAttribute',
      name: el.getAttribute('name') ?? '',
      type: el.getAttribute('eType') ?? '',
      lowerBound: Number(el.getAttribute('lowerBound') ?? '0'),
      upperBound: Number(el.getAttribute('upperBound') ?? '1'),
    };
  }

  private parseEReference(el: Element): EReferenceJson {
    return {
      kind: 'EReference',
      name: el.getAttribute('name') ?? '',
      type: el.getAttribute('eType') ?? '',

      lowerBound: Number(el.getAttribute('lowerBound') ?? '0'),
      upperBound: Number(el.getAttribute('upperBound') ?? '1'),

      // optional EMF semantics
      containment: el.getAttribute('containment') === 'true' || undefined,
      derived: el.getAttribute('derived') === 'true' || undefined,
      transient: el.getAttribute('transient') === 'true' || undefined,
      volatile: el.getAttribute('volatile') === 'true' || undefined,
      changeable: el.getAttribute('changeable') === 'true' || undefined,

      // opposite reference (if present)
      opposite: el.getAttribute('eOpposite') || undefined,
    };
  }


  private parseEEnum(el: Element): EEnumJson {
    return {
      kind: 'EEnum',
      name: el.getAttribute('name') ?? '',
      literals: Array.from(el.children)
        .filter(c => c.tagName === 'eLiterals')
        .map(c => c.getAttribute('name') ?? ''),
    };
  }

  private parseEDataType(el: Element): EDataTypeJson {
    return {
      kind: 'EDataType',
      name: el.getAttribute('name') ?? '',
      instanceTypeName: el.getAttribute('instanceTypeName') ?? '',
    };
  }
}
