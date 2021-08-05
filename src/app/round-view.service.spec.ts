import { TestBed } from '@angular/core/testing';

import { RoundViewService } from './round-view.service';

describe('RoundViewService', () => {
  let service: RoundViewService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RoundViewService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
