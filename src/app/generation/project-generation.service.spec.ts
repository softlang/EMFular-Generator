import { TestBed } from '@angular/core/testing';

import { ProjectGenerationService } from './project-generation.service';

describe('ProjectGenerationService', () => {
  let service: ProjectGenerationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProjectGenerationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
