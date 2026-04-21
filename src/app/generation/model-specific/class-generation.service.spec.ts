import { TestBed } from '@angular/core/testing';

import { ClassGenerationService } from './class-generation.service';

describe('ClassGenerationService', () => {
  let service: ClassGenerationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClassGenerationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
