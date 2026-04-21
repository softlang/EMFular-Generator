import {Component, Inject} from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';

import {EPackageJson} from '../../parsing-model/package';

@Component({
  selector: 'package-selection-dialog',
  imports: [
    FormsModule,
    MatRadioModule,
    MatButtonModule,
    MatDialogModule,
  ],
  templateUrl: './package-selection-dialog.html',
  styleUrl: './package-selection-dialog.css',
})
export class PackageSelectionDialogComponent {
  selected: EPackageJson | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public candidates: EPackageJson[],
    private dialogRef: MatDialogRef<PackageSelectionDialogComponent>
  ) {}

  confirm() {
    this.dialogRef.close(this.selected);
  }

  cancel() {
    this.dialogRef.close(null);
  }

}
