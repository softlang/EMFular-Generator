import { TestBed } from '@angular/core/testing';

import { SingleFileGeneratorService } from './single-file-generator.service';

describe('SingleFileGeneratorService', () => {
  let service: SingleFileGeneratorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SingleFileGeneratorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
