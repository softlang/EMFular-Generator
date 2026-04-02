import { TestBed } from '@angular/core/testing';

import { Class2JsonService } from './class2json.service';

describe('Class2JsonService', () => {
  let service: Class2JsonService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Class2JsonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
