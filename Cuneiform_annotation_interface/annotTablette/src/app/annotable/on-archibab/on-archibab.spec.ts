import { TestBed } from '@angular/core/testing';

import { OnArchibab } from './on-archibab';

describe('OnArchibab', () => {
  let service: OnArchibab;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OnArchibab);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
