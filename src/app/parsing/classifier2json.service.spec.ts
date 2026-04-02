import { TestBed } from '@angular/core/testing';

import { Classifier2JsonService } from './classifier2json.service';

describe('Class2JsonService', () => {
  let service: Classifier2JsonService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Classifier2JsonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
