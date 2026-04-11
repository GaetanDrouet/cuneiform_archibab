import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TxtAnnot } from './txt-annot';

describe('TxtAnnot', () => {
  let component: TxtAnnot;
  let fixture: ComponentFixture<TxtAnnot>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TxtAnnot]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TxtAnnot);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
