import {Injectable} from '@angular/core';
import {EPackageJson} from '../../parsing/ecore-model/package';
import {EClassJson} from '../../parsing/ecore-model/classifier';
import {Package} from '../../synthesis-model/package';
import {EClass} from '../../synthesis-model/classifier';
import {ClassifierReference} from '../../synthesis-model/cross-references';
import {RootSelectionDialogComponent} from './root-selection-dialog/root-selection-dialog.component';
import {firstValueFrom} from 'rxjs';
import {MatDialog} from '@angular/material/dialog';

@Injectable({
  providedIn: 'root',
})
export class RootFindingService {

  constructor(
    private dialog: MatDialog,
  ) {}

  public async determineRoot(pkgs: EPackageJson[], rootByUser?: ClassifierReference): Promise<ClassifierReference> {
    if(rootByUser) {
      return rootByUser;
    } else {
      return await this.rootByAsking(pkgs)
    }
  }

  private async rootByAsking(pkgs: EPackageJson[]): Promise<ClassifierReference> {
    //first reduce classes on pkgs to that that are root candidates:
    const resPkgs = pkgs.map(p => this.reduceToCandidates(p))
    //then check if there is only one real candidate - if yes, use it, else ask the user.
    const candidates: EClassJson[] = resPkgs.flatMap(p => p.eClasses)
    if (candidates.length === 1) {
      throw new Error('Not implemented yet');
      //return candidates[0];
    }
    if (candidates.length === 0) {
      throw new Error("No non-abstract, not interface-like class found, hence no useful generation possible")
    }
    const userRoot = null//await this.pickRoot2(resPkgs)
    if(!userRoot) {
      throw new Error("Please pick a root class")
    }
    return userRoot;
  }

  private async pickRoot2(pkgs: Package[]): Promise<EClass| null> {
    return null; //todo
  }

  private reduceToCandidates(pkg: EPackageJson): EPackageJson {
    const res: EPackageJson = {
      ...pkg
    }
    res.eClasses = this.allPossibleRootClasses(pkg)
    return res
  }

  private rootFromUser(model: EPackageJson, rootByUser: string): EClassJson {
    const root = model.eClasses.find(c => c.name === rootByUser)
    if (!root) {
      throw new Error(`Given Root class ${rootByUser} not found on Package ${model.name}.\n`
        +`Classes are ${model.eClasses.map(c => c.name).join(', ')}.`);
    }
    return root;
  }


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


  async determineRoot2(model: EPackageJson): Promise<EClassJson | null> {
    const candidates = this.allPossibleRootClasses(model);
    if (candidates.length === 1) {
      return candidates[0];
    }
    if (candidates.length === 0) {
      throw new Error("No non-abstract, not interface-like class found, hence no useful generation possible")
    }
    return await this.pickRoot(candidates);
  }

  async pickRoot(candidates: EClassJson[]): Promise<EClassJson | null> {
    const dialogRef = this.dialog.open(RootSelectionDialogComponent, {
      data: candidates,
    });
    return await firstValueFrom(dialogRef.afterClosed());
  }


}
