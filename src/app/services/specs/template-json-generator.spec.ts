import { TestBed } from '@angular/core/testing';

import { TemplateJsonGeneratorService } from '../template-json-generator';

describe('TemlateJsonGenerator', () => {
  let service: TemplateJsonGeneratorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TemplateJsonGeneratorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
