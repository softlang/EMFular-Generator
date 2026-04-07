import { TestBed } from '@angular/core/testing';

import { EPackage2JsonService } from './epackage2json.service';

describe('EPackage2JsonService', () => {
  let service: EPackage2JsonService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EPackage2JsonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
