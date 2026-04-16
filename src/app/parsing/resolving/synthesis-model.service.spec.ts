import { TestBed } from '@angular/core/testing';

import { SynthesisModelService } from './synthesis-model.service';

describe('SynthesisModelService', () => {
  let service: SynthesisModelService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SynthesisModelService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
