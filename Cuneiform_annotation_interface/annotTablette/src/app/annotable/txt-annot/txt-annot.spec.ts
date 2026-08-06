import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TransliterationService } from '../transliteration-service/transliteration-service';

import { OnLocal } from '../on-local/on-local'; //À Modifier au passage à Archibab

import { TxtAnnot } from './txt-annot';

describe('TxtAnnot', () => {
  let component: TxtAnnot;
  let fixture: ComponentFixture<TxtAnnot>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TxtAnnot],
      providers: [
        {
          provide: TransliterationService,
          useValue: {
            loadDictionaries: () => {}
          }
        },
        {
          provide: OnLocal,
          useValue: {}
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TxtAnnot);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});