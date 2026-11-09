import { TestBed } from '@angular/core/testing';

import { EditGenerationService } from './edit-generation.service';

describe('ModelServiceGenerationService', () => {
  let service: EditGenerationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EditGenerationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
