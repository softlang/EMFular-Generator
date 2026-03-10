import { Injectable } from '@angular/core';

export interface ParsedEcoreModel {
  nsURI: string;
  classNames: string[];
  classes: ParsedEClass[];
}

export interface ParsedEClass {
  name: string;
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
  many: boolean;
  containment: boolean;
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
          const eType = f.getAttribute('eType') ?? '';
          const tsType = this.mapType(eType);
          const defaultValue = this.defaultValueFor(tsType);

          attributes.push({ name, tsType, defaultValue });
        }

        if (fType === 'ecore:EReference') {
          const eType = f.getAttribute('eType') ?? '';
          const targetType = this.mapEReferenceType(eType, classNames);
          const upperBound = f.getAttribute('upperBound');
          const many = upperBound === '-1';
          const containment = (f.getAttribute('containment') ?? '').toLowerCase() === 'true';

          references.push({
            name,
            targetType,
            many,
            containment,
          });
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

  private defaultValueFor(tsType: string): string {
    if (tsType === 'string') return '""';
    if (tsType === 'number') return '0';
    if (tsType === 'boolean') return 'false';
    return 'null as any';
  }
}
