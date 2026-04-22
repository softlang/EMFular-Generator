import { TestBed } from '@angular/core/testing';

import { AttributeResolver } from './attribute-resolver';

describe('AttributeResolver', () => {
  let service: AttributeResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AttributeResolver);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
