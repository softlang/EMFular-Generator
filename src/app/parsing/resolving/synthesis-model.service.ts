import { Injectable } from '@angular/core';
import {EPackageJson} from '../../parsing-model/package';
import {Package} from '../../generation-model/package';

@Injectable({
  providedIn: 'root',
})
export class SynthesisModelService {

  ecoreJson2synthesisModel(raw: EPackageJson[]): Package[] {
    return [];
  }
}
