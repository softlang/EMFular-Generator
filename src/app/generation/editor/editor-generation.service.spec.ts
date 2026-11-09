import { TestBed } from '@angular/core/testing';

import { EditorGenerationService } from './editor-generation.service';

describe('EditorGenerationService', () => {
  let service: EditorGenerationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EditorGenerationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
