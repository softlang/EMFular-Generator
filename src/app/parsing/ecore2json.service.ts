import { Injectable } from '@angular/core';
import {
  EPackageJson,
  EClassJson,
  EAttributeJson,
  EReferenceJson,
  EEnumJson,
  EDataTypeJson,
} from './ecore-json';
import {RootFindingService} from './root-finding.service';

@Injectable({
  providedIn: 'root',
})
export class Ecore2JsonService {

  constructor(private rootFindingService: RootFindingService) {
  }

  parse(xml: string): EPackageJson {
    const doc = this.parseXml(xml);
    const root = doc.documentElement;

    if (!root.tagName.endsWith('EPackage')) {
      throw new Error('Root element is not an EPackage');
    }
    const name = root.getAttribute('name') ?? ''

    const pkg: EPackageJson = {
      name: name,
      pascalizedName: this.pascalCase(name),
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
    this.resolveSuperTypes(pkg)
    this.inferInterfaceLike(pkg)
    this.rootFindingService.determineRoot(pkg)
    return pkg;
  }

  inferInterfaceLike(pkg: EPackageJson) {
    for (const cls of pkg.eClasses) {
      this.interfaceLike(pkg, cls.name)
    }
  }

  interfaceLike(pkg: EPackageJson, className: string): boolean {
    const cls = pkg.eClasses.find(cls => cls.name === className);
    if (!cls) {
      throw new Error("No class with name '" + className + "' found");
    }
    if (cls.interfaceLike !== undefined) {
      return cls.interfaceLike;
    }
    //necessary: abstract and feature-less
    if (!(cls.abstract && cls.attributes.length === 0 && cls.references.length === 0)) {
      cls.interfaceLike = false;
      return false;
    }

    // All supertypes must be interface-like
    const allSupersInterfaceLike = cls.resolvedSuperTypes.every(
      superName => this.interfaceLike(pkg, superName)
    );
    cls.interfaceLike = allSupersInterfaceLike;
    return allSupersInterfaceLike;
  }

  resolveSuperTypes(pkg: EPackageJson) {
    for (const cls of pkg.eClasses) {
      cls.resolvedSuperTypes = cls.superTypes
        .map(uri => this.resolveSuperTypeUri(uri, pkg))
        .filter((x): x is string => !!x);
    }
  }

  private resolveSuperTypeUri(uri: string, pkg: EPackageJson): string | undefined {
    // Case 1: "#//Person"
    if (uri.includes('#//')) {
      const name = uri.split('#//').pop()!;
      return pkg.eClasses.some(c => c.name === name) ? name : undefined;
    }

    // Case 2: "ecore:Person"
    if (uri.includes(':')) {
      const name = uri.split(':').pop()!;
      return pkg.eClasses.some(c => c.name === name) ? name : undefined;
    }

    // Case 3: XMI index "#/0/@eClassifiers.1"
    const match = uri.match(/@eClassifiers\.(\d+)/);
    if (match) {
      const index = Number(match[1]);
      const cls = pkg.eClasses.find(c => c._index === index);
      return cls?.name;
    }

    return undefined;
  }


  inferTreeParents(pkg: EPackageJson) {
    // Build a lookup table following the opposite naming schema
    const refIndex = new Map<string, EReferenceJson>();
    for (const cls of pkg.eClasses) {
      for (const ref of cls.references) {
        refIndex.set(`#//${cls.name}/${ref.name}`, ref);
      }
    }
    // Now resolve opposites and infer tree-parent
    for (const cls of pkg.eClasses) {
      for (const ref of cls.references) {
        if (!ref.opposite) {
          continue;
        }
        const oppositeRef = refIndex.get(ref.opposite);
        // A reference is a tree parent iff its opposite is containment
        if (oppositeRef?.containment === true) {
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
      resolvedSuperTypes: [],
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
    const res: EAttributeJson =  {
      kind: 'EAttribute',
      name: el.getAttribute('name') ?? '',
      type: el.getAttribute('eType') ?? '',
      lowerBound: Number(el.getAttribute('lowerBound') ?? '0'),
      upperBound: Number(el.getAttribute('upperBound') ?? '1'),
    };
    const defaultValue = el.getAttribute('defaultValueLiteral');
    if (defaultValue !== null) {
      res.defaultValueLiteral = defaultValue;
    }
    return res;
  }

  private normalizeTypeName(raw: string): string {
    const idx = raw.lastIndexOf("#//");
    return idx >= 0 ? raw.substring(idx + 3) : raw;
  }

  private normalizeOpposite(raw: string|undefined): string|undefined {
    if (!raw ) return undefined;
    const idx = raw.lastIndexOf("/");
    return idx >= 0 ? raw.substring(idx + 1) : raw;
  }

  private parseEReference(el: Element): EReferenceJson {
    const type = el.getAttribute('eType') ?? '';
    const opposite = el.getAttribute('eOpposite') || undefined
    return {
      kind: 'EReference',
      name: el.getAttribute('name') ?? '',
      type: type,
      resolvedType: this.normalizeTypeName(type) ,
      lowerBound: Number(el.getAttribute('lowerBound') ?? '0'),
      upperBound: Number(el.getAttribute('upperBound') ?? '1'),

      // optional EMF semantics
      containment: el.getAttribute('containment') === 'true' || undefined,
      derived: el.getAttribute('derived') === 'true' || undefined,
      transient: el.getAttribute('transient') === 'true' || undefined,
      volatile: el.getAttribute('volatile') === 'true' || undefined,
      changeable: el.getAttribute('changeable') === 'true' || undefined,

      // opposite reference (if present)
      opposite: opposite,
      resolvedOpposite: this.normalizeOpposite(opposite),
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

  private pascalCase(str: string): string {
    return str
      .split(/[_\s-]+/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }

  private parseXml(xml: string): Document {
    const parser = new DOMParser();
    const dom = parser.parseFromString(xml, 'application/xml');

    const error = dom.querySelector('parsererror');
    if (error) {
      throw new Error('The uploaded file is not valid XML.');
    }

    return dom;
  }
}
