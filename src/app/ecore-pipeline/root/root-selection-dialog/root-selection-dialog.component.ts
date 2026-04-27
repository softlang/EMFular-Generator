import {Component, Inject, OnInit} from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import {EClassJson} from '../../parsing-model/classifier';
import {EPackageJson} from '../../parsing-model/package';
import {EClassManager} from '../../../eclass/eclass-manager';


@Component({
  selector: 'root-selection-dialog',
  imports: [
    FormsModule,
    MatRadioModule,
    MatButtonModule,
    MatDialogModule,
  ],
  templateUrl: './root-selection-dialog.component.html',
  styleUrl: './root-selection-dialog.component.css',
})
export class RootSelectionDialogComponent implements OnInit {
  packages: any[] = [];
  selectedEclass: string|null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public pkgs: EPackageJson[],
    private dialogRef: MatDialogRef<RootSelectionDialogComponent>
  ) {}

  ngOnInit() {
    this.packages = this.pkgs.map(pkg => ({
      ...pkg,
      classesWithUri: pkg.eClasses.map(cls => ({
        cls: cls,
        uri: EClassManager.createEClass(pkg, cls)
      }))
    }));
  }

  confirm() {
    this.dialogRef.close(this.selectedEclass);
  }

  cancel() {
    this.dialogRef.close(null);
  }

  hasContainment(cls: EClassJson): boolean {
    return cls.references?.some(r => r.containment) ?? false;
  }

  allFeaturesTransient(cls: EClassJson): boolean {
    return cls.references?.every(r => r.transient) ?? false;
  }

}
