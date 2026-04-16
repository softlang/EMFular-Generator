import {Injectable} from '@angular/core';
import {EPackageJson} from '../../parsing/ecore-model/package';
import {EClassJson} from '../../parsing/ecore-model/classifier';
import {Package} from '../../synthesis-model/package';
import {EClass} from '../../synthesis-model/classifier';

@Injectable({
  providedIn: 'root',
})
export class RootFindingService {

  public allPossibleRootClasses2(pkg: Package): EClass[] {
    return pkg.classes.filter(
      cls =>
        !cls.abstract
        && cls.interfaceLike !== true
    )
  }

  public allPossibleRootClasses(model: EPackageJson): EClassJson[] {
    return model.eClasses.filter(
      cls =>
        !cls.abstract
        && cls.interfaceLike !== true
    )
  }


}
