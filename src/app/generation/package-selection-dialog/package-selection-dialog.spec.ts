import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PackageSelectionDialog } from './package-selection-dialog';

describe('PackageSelectionDialog', () => {
  let component: PackageSelectionDialog;
  let fixture: ComponentFixture<PackageSelectionDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PackageSelectionDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(PackageSelectionDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
