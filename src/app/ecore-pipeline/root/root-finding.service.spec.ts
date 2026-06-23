import { TestBed } from '@angular/core/testing';

import { RootFindingService } from './root-finding.service';

describe('RootFindingService', () => {
  let service: RootFindingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RootFindingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
