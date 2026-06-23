import { TestBed } from '@angular/core/testing';

import { PlaceholderReplacerService } from './place-holder-replacer.service';

describe('PlaceHolderReplacer', () => {
  let service: PlaceholderReplacerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlaceholderReplacerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
