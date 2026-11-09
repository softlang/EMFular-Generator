import {Injectable} from '@angular/core';
import {EClassJson, EPackageJson} from '../../parsing/ecore-json';

@Injectable({
  providedIn: 'root',
})
export class RootFindingService {

  public allPossibleRootClasses(model: EPackageJson): EClassJson[] {
    return model.eClasses.filter(
      cls =>
        !cls.abstract
        && cls.interfaceLike !== true
    )
  }

}
