import { TestBed } from '@angular/core/testing';

import { RootChoosingService } from './root-choosing.service';

describe('RootFindingService', () => {
  let service: RootChoosingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RootChoosingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
