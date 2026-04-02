import { TestBed } from '@angular/core/testing';

import { Reference2JsonService } from './reference2json.service';

describe('Reference2JsonService', () => {
  let service: Reference2JsonService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Reference2JsonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
