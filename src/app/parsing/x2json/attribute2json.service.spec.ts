import { TestBed } from '@angular/core/testing';

import { Attribute2JsonService } from './attribute2json.service';

describe('Attribute2JsonService', () => {
  let service: Attribute2JsonService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Attribute2JsonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
