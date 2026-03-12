import { TestBed } from '@angular/core/testing';

import { ModelGenerationService } from './model-generation.service';

describe('ModelGenerationService', () => {
  let service: ModelGenerationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModelGenerationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
