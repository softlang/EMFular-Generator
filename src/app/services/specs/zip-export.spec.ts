import { TestBed } from '@angular/core/testing';

import { ZipExportService } from '../zip-export';

describe('ZipExport', () => {
  let service: ZipExportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ZipExportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
