import { TestBed } from '@angular/core/testing';

import { RootHeuricticService } from './root-heurictic-service';

describe('RootHeuricticService', () => {
  let service: RootHeuricticService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RootHeuricticService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
