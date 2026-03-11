import { TestBed } from '@angular/core/testing';

import { Ecore2jsonService } from './ecore2json.service';

describe('Ecore2jsonService', () => {
  let service: Ecore2jsonService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Ecore2jsonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
