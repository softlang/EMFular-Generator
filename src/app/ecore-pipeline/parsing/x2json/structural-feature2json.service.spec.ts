import { TestBed } from '@angular/core/testing';

import { StructuralFeature2JsonService } from './structural-feature2json.service';

describe('StructuralFeature2jsonService', () => {
  let service: StructuralFeature2JsonService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StructuralFeature2JsonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
