import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RootSelectionDialogComponent } from './root-selection-dialog.component';

describe('RootSelectionDialogComponent', () => {
  let component: RootSelectionDialogComponent;
  let fixture: ComponentFixture<RootSelectionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RootSelectionDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RootSelectionDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
