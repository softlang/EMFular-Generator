import { TestBed } from '@angular/core/testing';

import { Parsing2GenerationService } from './parsing2generation.service';

describe('Parsing2GenerationService', () => {
  let service: Parsing2GenerationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Parsing2GenerationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
