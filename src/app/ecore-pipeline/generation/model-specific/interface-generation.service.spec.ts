import { TestBed } from '@angular/core/testing';

import { InterfaceGenerationService } from './interface-generation.service';

describe('InterfaceGenerationService', () => {
  let service: InterfaceGenerationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InterfaceGenerationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
