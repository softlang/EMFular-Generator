import {Component, Inject, OnInit} from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import {RootFindingPkgModel} from '../root-finding-cls-model';


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
  selectedEclass: string|null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public pkgs: RootFindingPkgModel[],
    private dialogRef: MatDialogRef<RootSelectionDialogComponent>
  ) {}

  confirm() {
    this.dialogRef.close(this.selectedEclass);
  }

  cancel() {
    this.dialogRef.close(null);
  }

}
