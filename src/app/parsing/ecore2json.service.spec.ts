import { TestBed } from '@angular/core/testing';

import { Ecore2JsonService } from './ecore2json.service';

describe('Ecore2jsonService', () => {
  let service: Ecore2JsonService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Ecore2JsonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
