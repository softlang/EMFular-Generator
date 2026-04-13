import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import {EClassJson} from '../../../parsing/ecore-model/classifier';


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
export class RootSelectionDialogComponent {
  selected: EClassJson | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public candidates: EClassJson[],
    private dialogRef: MatDialogRef<RootSelectionDialogComponent>
  ) {}

  confirm() {
    this.dialogRef.close(this.selected);
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
