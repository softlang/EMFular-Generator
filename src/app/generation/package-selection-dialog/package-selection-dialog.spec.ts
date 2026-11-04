import { ComponentFixture, TestBed } from '@angular/core/testing';

import {PackageSelectionDialogComponent} from './package-selection-dialog';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

describe('PackageSelectionDialog', () => {
  let component: PackageSelectionDialogComponent;
  let fixture: ComponentFixture<PackageSelectionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PackageSelectionDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: [] },
        { provide: MatDialogRef, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PackageSelectionDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
