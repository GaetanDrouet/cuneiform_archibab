import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabSelect } from './tab-select';

describe('TabSelect', () => {
  let component: TabSelect;
  let fixture: ComponentFixture<TabSelect>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabSelect]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TabSelect);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
