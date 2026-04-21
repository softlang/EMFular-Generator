import { TestBed } from '@angular/core/testing';

import { ModelServiceGenerationService } from './model-service-generation.service';

describe('ModelServiceGenerationService', () => {
  let service: ModelServiceGenerationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModelServiceGenerationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
