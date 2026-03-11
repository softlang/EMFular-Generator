import { TestBed } from '@angular/core/testing';

import { MetaGenerationService10 } from './meta-generation-service10';

describe('MetaGenerationService10', () => {
  let service: MetaGenerationService10;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MetaGenerationService10);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
