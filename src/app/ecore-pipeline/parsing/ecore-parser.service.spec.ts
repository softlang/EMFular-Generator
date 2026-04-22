import { TestBed } from '@angular/core/testing';

import { EcoreParserService } from './ecore-parser.service';

describe('Ecore2jsonService', () => {
  let service: EcoreParserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EcoreParserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
