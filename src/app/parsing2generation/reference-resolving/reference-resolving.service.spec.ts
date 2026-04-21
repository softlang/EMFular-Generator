import { TestBed } from '@angular/core/testing';

import { ReferenceResolvingService } from './reference-resolving.service';

describe('ReferenceResolvingService', () => {
  let service: ReferenceResolvingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReferenceResolvingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
