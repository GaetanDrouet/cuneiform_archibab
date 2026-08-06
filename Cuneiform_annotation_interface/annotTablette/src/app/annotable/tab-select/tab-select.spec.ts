import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { of } from 'rxjs'; // pour créer un faux test

import { OnLocal } from '../on-local/on-local'; //À Modifier au passage à Archibab

import { TabSelect } from './tab-select';

describe('TabSelect', () => {
  let component: TabSelect;
  let fixture: ComponentFixture<TabSelect>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabSelect],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({})
          }
        },
        {
          provide: Location,
          useValue: {
            replaceState: () => {}
          }
        },
        {
          provide: OnLocal,
          useValue: {
            findId: async () => null
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TabSelect);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
