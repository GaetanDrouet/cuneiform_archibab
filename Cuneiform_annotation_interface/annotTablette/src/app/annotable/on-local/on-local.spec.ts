import { TestBed } from '@angular/core/testing';

import { OnLocal } from './on-local';

describe('OnLocal', () => {
  let service: OnLocal;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OnLocal);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
