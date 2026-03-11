import { TestBed } from '@angular/core/testing';

import { EcoreParsingService } from './ecore-parsing-service';

describe('EcoreParsingService', () => {
  let service: EcoreParsingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EcoreParsingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
