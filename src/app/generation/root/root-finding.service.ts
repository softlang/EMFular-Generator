import {Injectable} from '@angular/core';
import {EClassJson, EPackageJson} from '../../parsing/ecore-json';
import {MatDialog} from '@angular/material/dialog';
import {RootSelectionDialogComponent} from './root-selection-dialog/root-selection-dialog.component';
import {firstValueFrom} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RootFindingService {

  constructor(private dialog: MatDialog) {}

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
