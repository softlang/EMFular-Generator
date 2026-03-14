import {Component, Inject} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import {EClassJson} from '../../../parsing/ecore-json';
import {FormsModule} from '@angular/forms';
import {MatRadioButton, MatRadioGroup} from '@angular/material/types/radio';
import {MatButton} from '@angular/material/types/button';

@Component({
  selector: 'root-selection-dialog',
  imports: [
    MatDialogActions,
    MatRadioGroup,
    MatRadioButton,
    FormsModule,
    MatDialogContent,
    MatDialogTitle,
    MatButton,
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

  isMany(): boolean {
    return this.candidates.length>1
  }

  isNone(): boolean {
    return this.candidates.length === 0;
  }

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
