import { Injectable } from '@angular/core';
import {Classifier2JsonService} from './classifier2json.service';
import {EPackageJson} from '../ecore-json';

@Injectable({
  providedIn: 'root',
})
export class EPackage2JsonService {

  constructor(
    private classifiers2Json: Classifier2JsonService,
  ) {}

  parsePackage(root: Element): EPackageJson {
    if (!root.tagName.endsWith('EPackage')) {
      throw new Error('Not an EPackage');
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
          const cls = this.classifiers2Json.parseEClass(child, index);
          pkg.eClasses.push(cls);
        } else if (type === 'ecore:EEnum') {
          const en = this.classifiers2Json.parseEEnum(child, index);
          pkg.eEnums.push(en);
        } else if (type === 'ecore:EDataType') {
          const dt = this.classifiers2Json.parseEDataType(child, index);
          pkg.eDataTypes.push(dt);
        }
        index++
      }
    }
    return pkg;
  }

  private pascalCase(str: string): string {
    return str
      .split(/[_\s-]+/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }

}
