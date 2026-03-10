import { TestBed } from '@angular/core/testing';

import { AppComponentGeneratorService } from '../app-component-generation';

describe('AppComponentGeneration', () => {
  let service: AppComponentGeneratorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppComponentGeneratorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
