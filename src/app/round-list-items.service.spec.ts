import { TestBed } from '@angular/core/testing';

import { RoundListItemsService } from './round-list-items.service';

describe('RoundListItemsService', () => {
  let service: RoundListService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RoundListItemsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
