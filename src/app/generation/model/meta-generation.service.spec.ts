import { TestBed } from '@angular/core/testing';

import { MetaGenerationService } from './meta-generation.service';

describe('MetaGenerationService10', () => {
  let service: MetaGenerationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MetaGenerationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
