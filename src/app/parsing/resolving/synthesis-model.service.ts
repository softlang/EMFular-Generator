import { Injectable } from '@angular/core';
import {EPackageJson} from '../ecore-model/package';
import {Package} from '../../synthesis-model/package';

@Injectable({
  providedIn: 'root',
})
export class SynthesisModelService {

  ecoreJson2synthesisModel(raw: EPackageJson[]): Package[] {
    return [];
  }
}
