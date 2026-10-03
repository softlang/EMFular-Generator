import { ComponentFixture, TestBed } from '@angular/core/testing';

import {PackageSelectionDialogComponent} from './package-selection-dialog';

describe('PackageSelectionDialog', () => {
  let component: PackageSelectionDialogComponent;
  let fixture: ComponentFixture<PackageSelectionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PackageSelectionDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PackageSelectionDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
