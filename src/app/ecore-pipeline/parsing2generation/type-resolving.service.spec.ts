import { TestBed } from '@angular/core/testing';

import { TypeResolvingService } from './type-resolving.service';

describe('TypeResolvingService', () => {
  let service: TypeResolvingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TypeResolvingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
