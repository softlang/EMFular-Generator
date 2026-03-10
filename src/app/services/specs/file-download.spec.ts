import { TestBed } from '@angular/core/testing';

import { FileDownloadService } from '../file-download';

describe('FileDownload', () => {
  let service: FileDownloadService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileDownloadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
