import { TestBed } from '@angular/core/testing';

import { TemplateLoadService } from './template-load.service';

describe('TemplateLoad', () => {
  let service: TemplateLoadService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TemplateLoadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
