import { Injectable } from '@angular/core';

export interface ParsedEcoreModel {
  nsURI: string;
  classNames: string[];
  classes: ParsedEClass[];
}

export interface ParsedEClass {
  name: string;
  isAbstract?: true;
  attributes: ParsedEAttribute[];
  references: ParsedEReference[];
}

export interface ParsedEAttribute {
  name: string;
  tsType: string;
  defaultValue: string;
}

export interface ParsedEReference {
  name: string;
  targetType: string;
  max: number
  min?: number;
  containment?: true;
  isParent?: true;
  derivingMethod?: symbol;
  opposite?: string;
}

@Injectable({
  providedIn: 'root',
})
export class EcoreParserService {
  parse(ecoreXml: string): ParsedEcoreModel {
    const doc = new DOMParser().parseFromString(ecoreXml, 'application/xml');

    if (doc.getElementsByTagName('parsererror').length) {
      throw new Error('Invalid XML');
    }

    const eClassifiers = Array.from(doc.getElementsByTagName('eClassifiers'));

    const ePackage = doc.getElementsByTagName('ecore:EPackage')[0] ?? doc.documentElement;
    const nsURI = ePackage?.getAttribute('nsURI') ?? 'http://test';

    const classNames: string[] = [];

    for (const cls of eClassifiers) {
      const xsiType = this.getXsiType(cls);
      if (xsiType !== 'ecore:EClass') continue;

      const className = cls.getAttribute('name');
      if (className) classNames.push(className);
    }

    const classes: ParsedEClass[] = [];

    for (const cls of eClassifiers) {
      const xsiType = this.getXsiType(cls);
      if (xsiType !== 'ecore:EClass') continue;

      const className = cls.getAttribute('name');
      if (!className) continue;

      const features = Array.from(cls.getElementsByTagName('eStructuralFeatures'));

      const attributes: ParsedEAttribute[] = [];
      const references: ParsedEReference[] = [];

      for (const f of features) {
        const fType = this.getXsiType(f);
        const name = f.getAttribute('name');
        if (!name) continue;

        if (fType === 'ecore:EAttribute') {
          attributes.push(this.parseAttribute(f, name));
        }

        if (fType === 'ecore:EReference') {
          references.push(this.parseReference(f, name, classNames));
        }
      }

      classes.push({
        name: className,
        attributes,
        references,
      });
    }

    return {
      nsURI,
      classNames,
      classes,
    };
  }

  private parseReference(f: Element, name: string, classNames: string[]): ParsedEReference {
    const eType = f.getAttribute('eType') ?? '';
    const targetType = this.mapEReferenceType(eType, classNames);
    const max = EcoreParserService.string2int(f.getAttribute('upperBound'));
    const containment = (f.getAttribute('containment') ?? '').toLowerCase() === 'true';

    return {
      name: name,
      targetType: targetType,
      max: max,
      containment: containment,
    } as ParsedEReference;
  }

  private parseAttribute(f: Element, name: string): ParsedEAttribute {
    const eType = f.getAttribute('eType') ?? '';
    const tsType = this.mapType(eType);
    const defaultValue = this.defaultValueFor(tsType); //todo use real default if existent

    return { name, tsType, defaultValue } as ParsedEAttribute;
  }

  private getXsiType(el: Element): string | null {
    return (
      el.getAttribute('xsi:type') ||
      el.getAttributeNS('http://www.w3.org/2001/XMLSchema-instance', 'type')
    );
  }

  private mapType(eType: string): string {
    if (eType.includes('EString')) return 'string';
    if (eType.includes('EInt') || eType.includes('EDouble') || eType.includes('EFloat')) {
      return 'number';
    }
    if (eType.includes('EBoolean')) return 'boolean';
    //add enum handling
    return 'any';
  }

  private mapEReferenceType(eType: string, knownClassNames: string[]): string {
    const match = eType.match(/#\/\/(.+)$/);
    if (match?.[1]) {
      const name = this.sanitizeTypeName(match[1]);
      if (knownClassNames.includes(name)) return name;
      return name;
    }
    return 'any';
  }

  private sanitizeTypeName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  //todo
  private defaultValueFor(tsType: string): string {
    if (tsType === 'string') return '""';
    if (tsType === 'number') return '0';
    if (tsType === 'boolean') return 'false';
    return 'null as any';
  }

  private static string2int(s: string|null): number {
    if(!s) return 0;
    else {
      return parseInt(s, 10);
    }
  }
}
