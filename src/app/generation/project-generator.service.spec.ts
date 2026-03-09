import { TestBed } from '@angular/core/testing';

import { ProjectGeneratorService } from './project-generator.service';

describe('ProjectGeneratorService', () => {
  let service: ProjectGeneratorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProjectGeneratorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
