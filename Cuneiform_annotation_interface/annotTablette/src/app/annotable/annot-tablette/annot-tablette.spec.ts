import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { AnnotTablette } from './annot-tablette';
import { TransliterationService } from '../transliteration-service/transliteration-service';
import { OnLocal } from '../on-local/on-local';

describe('AnnotTablette', () => {
  let component: AnnotTablette;
  let fixture: ComponentFixture<AnnotTablette>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnnotTablette],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({})
          }
        },
        {
          provide: TransliterationService,
          useValue: {
            loadDictionaries: () => {}
          }
        },
        {
          provide: OnLocal,
          useValue: {
            initialCreator: async () => ({
              id: "",
              name: ""
            }),
            creatorIsEditable: true
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnnotTablette);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
/*import { TestBed } from '@angular/core/testing';
import { AnnotTablette } from './annot-tablette';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnnotTablette],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AnnotTablette);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(AnnotTablette);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Hello, annotTablette');
  });
});*/
