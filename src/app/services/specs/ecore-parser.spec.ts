import { TestBed } from '@angular/core/testing';

import { EcoreParserService } from '../ecore-parser';

describe('EcoreParser', () => {
  let service: EcoreParserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EcoreParserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
