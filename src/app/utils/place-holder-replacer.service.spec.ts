import { TestBed } from '@angular/core/testing';

import { PlaceHolderReplacerService } from './place-holder-replacer.service';

describe('PlaceHolderReplacer', () => {
  let service: PlaceHolderReplacerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlaceHolderReplacerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
