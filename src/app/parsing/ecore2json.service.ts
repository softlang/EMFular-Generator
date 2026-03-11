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

    let index = 0
    for (const child of Array.from(root.children)) {
      if (child.tagName === 'eClassifiers') {
        const type = child.getAttribute('xsi:type');
        if (type === 'ecore:EClass') {
          pkg.eClasses.push(this.parseEClass(child, index));
        } else if (type === 'ecore:EEnum') {
          pkg.eEnums.push(this.parseEEnum(child, index));
        } else if (type === 'ecore:EDataType') {
          pkg.eDataTypes.push(this.parseEDataType(child, index));
        }
        index++
      }
    }
    this.inferTreeParents(pkg)
    return pkg;
  }

  inferTreeParents(pkg: EPackageJson) {
    // Build a lookup table: "ClassName.refName" → reference
    const refIndex = new Map<string, EReferenceJson>();
    for (const cls of pkg.eClasses) {
      for (const ref of cls.references) {
        refIndex.set(`${cls.name}.${ref.name}`, ref);
      }
    }
    // Now resolve opposites and infer tree-parent
    for (const cls of pkg.eClasses) {
      for (const ref of cls.references) {
        if (!ref.opposite) {
          continue;
        }
        const oppositeRef = refIndex.get(ref.opposite);
        if (!oppositeRef) {
          continue;
        }
        // A reference is a tree parent iff its opposite is containment
        if (oppositeRef.containment === true) {
          ref.isTreeParent = true;
        }
      }
    }
  }

  private parseEClass(el: Element, index: number): EClassJson {
    const cls: EClassJson = {
      kind: 'EClass',
      _index: index,
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


  private parseEEnum(el: Element, index: number): EEnumJson {
    return {
      kind: 'EEnum',
      _index: index,
      name: el.getAttribute('name') ?? '',
      literals: Array.from(el.children)
        .filter(c => c.tagName === 'eLiterals')
        .map(c => c.getAttribute('name') ?? ''),
    };
  }

  private parseEDataType(el: Element, index: number): EDataTypeJson {
    return {
      kind: 'EDataType',
      _index: index,
      name: el.getAttribute('name') ?? '',
      instanceTypeName: el.getAttribute('instanceTypeName') ?? '',
    };
  }
}
