import { TestBed } from '@angular/core/testing';

import { RootDependentGenerationService } from './root-dependent-generation.service';

describe('RootDependentGenerationService', () => {
  let service: RootDependentGenerationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RootDependentGenerationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
