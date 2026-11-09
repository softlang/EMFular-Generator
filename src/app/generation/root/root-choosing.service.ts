import {Injectable} from '@angular/core';
import {EClassJson, EPackageJson} from '../../parsing/ecore-json';
import {MatDialog} from '@angular/material/dialog';
import {RootSelectionDialogComponent} from './root-selection-dialog/root-selection-dialog.component';
import {firstValueFrom} from 'rxjs';
import {PackageSelectionDialogComponent} from './package-selection-dialog/package-selection-dialog';

@Injectable({
  providedIn: 'root',
})
export class RootChoosingService {

  constructor(private dialog: MatDialog) {}

  async chooseRoot(models: EPackageJson[], packageByUser?:string, rootByUser?: string): Promise<EClassJson> {
    const pkg: EPackageJson = await this.choosePackage(models, packageByUser)
    let root : EClassJson | null;
    if(rootByUser) {
      root = this.rootFromUser(pkg, rootByUser)
    } else {
      root = await this.determineRoot(pkg);
      if (root == null) {
        throw new Error(
          'Auto-detection for Root failed: No root candidate found - please choose one explicitly.'
        ); //todo we could generate all but services
      }
    }
    return root
  }

  async choosePackage(models: EPackageJson[], packageByUser?: string): Promise<EPackageJson> {
    if(models.length == 0){
      throw new Error('No EPackages found.');
    }
    let model: EPackageJson;
    if(packageByUser){
      let match = models.find(p => p.name == packageByUser)
      if(match){
        model = match;
      } else {
        throw new Error(
          `Given EPackage class ${packageByUser} not found.\n`
          +`Packages are ${models.map(c => c.name).join(', ')}.`
        );
      }
    } else {
      if (models.length == 1) {
        model = models[0]
      } else {  //no autodetection, just user choice
        const choice = await this.pickPackage(models);
        if (choice) {
          model = choice;
        } else {
          throw new Error(
            `Several packages found (${models.map(m => m.name)}) - please choose one explicitly.`
          );
        }
      }
    }
    return model
  }

  async pickPackage(candidates: EPackageJson[]): Promise<EPackageJson | null> {
    const dialogRef = this.dialog.open(PackageSelectionDialogComponent, {
      data: candidates,
    });
    return await firstValueFrom(dialogRef.afterClosed());
  }

  private rootFromUser(model: EPackageJson, rootByUser: string): EClassJson {
    const root = model.eClasses.find(c => c.name === rootByUser)
    if (!root) {
      throw new Error(`Given Root class ${rootByUser} not found on Package ${model.name}.\n`
        +`Classes are ${model.eClasses.map(c => c.name).join(', ')}.`);
    }
    return root;
  }

  async determineRoot(model: EPackageJson): Promise<EClassJson | null> {
    const candidates = this.allPossibleRootClasses(model);
    if (candidates.length === 1) {
      return candidates[0];
    }
    if (candidates.length === 0) {
      throw new Error("No non-abstract, not interface-like class found, hence no useful generation possible")
    }
    return await this.pickRoot(candidates);
  }

  private async pickRoot(candidates: EClassJson[]): Promise<EClassJson | null> {
    const dialogRef = this.dialog.open(RootSelectionDialogComponent, {
      data: candidates,
    });
    return await firstValueFrom(dialogRef.afterClosed());
  }

  private allPossibleRootClasses(model: EPackageJson): EClassJson[] {
    return model.eClasses.filter(
      cls =>
        !cls.abstract
        && cls.interfaceLike !== true
    )
  }

}
