import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImgAnnot } from './img-annot';

describe('ImgAnnot', () => {
  let component: ImgAnnot;
  let fixture: ComponentFixture<ImgAnnot>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImgAnnot]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImgAnnot);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
