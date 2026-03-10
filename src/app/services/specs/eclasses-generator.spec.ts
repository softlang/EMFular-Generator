import { TestBed } from '@angular/core/testing';

import { EclassesGeneratorService } from '../eclasses-generator';

describe('EclassesFileGeneration', () => {
  let service: EclassesGeneratorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EclassesGeneratorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
