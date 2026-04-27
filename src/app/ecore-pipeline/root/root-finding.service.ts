import {Injectable} from '@angular/core';
import {EPackageJson} from '../parsing-model/package';
import {EClassJson} from '../parsing-model/classifier';
import {RootSelectionDialogComponent} from './root-selection-dialog/root-selection-dialog.component';
import {firstValueFrom} from 'rxjs';
import {MatDialog} from '@angular/material/dialog';
import {EClassManager} from '../../eclass/eclass-manager';

@Injectable({
  providedIn: 'root',
})
export class RootFindingService {

  constructor(
    private dialog: MatDialog,
  ) {}

  public async determineRoot(pkgs: EPackageJson[], rootEclassByUser?: string): Promise<string> {
    if(rootEclassByUser) {
      return rootEclassByUser;
    } else {
      //first reduce classes on pkgs to that that are root candidates:
      const resPkgs = pkgs.map(p => this.reduceToCandidates(p))
      //then check if there is only one real candidate - if yes, use it, else ask the user.
      const justOne = this.justOne(pkgs);
      if (justOne) {
        return justOne;
      }
      const pickedRoot: string | null =  await this.pickRoot(resPkgs)
      if (pickedRoot) {
        return pickedRoot;
      } else {
        throw new Error('No root picked from ' + pkgs.map(pkg => pkg.name));
      }
    }
  }


  private justOne(pkgs: EPackageJson[]): string | null {
    let res: string |null = null;
    for (const pkg of pkgs) {
      for (const cls of pkg.eClasses) {
        if (res != null){
          //there is already one other class:
          return null
        }   else {
          res = EClassManager.createEClass(pkg, cls)
        }
      }
    }
    //if res is still null, then there are even no candidates
    if (res == null){
      throw new Error('No usable root classes found');
    }
    return res
  }

  private reduceToCandidates(pkg: EPackageJson): EPackageJson {
    const res: EPackageJson = {
      ...pkg
    }
    res.eClasses = this.allPossibleRootClasses(pkg)
    return res
  }

  public allPossibleRootClasses(model: EPackageJson): EClassJson[] {
    return model.eClasses.filter(
      cls =>
        !cls.abstract
        && cls.interfaceLike !== true
    )
  }

  async pickRoot(candidates: EPackageJson[]): Promise<string | null> {
    const dialogRef = this.dialog.open(RootSelectionDialogComponent, {
      data: candidates,
    });
    return await firstValueFrom(dialogRef.afterClosed());
  }

}
