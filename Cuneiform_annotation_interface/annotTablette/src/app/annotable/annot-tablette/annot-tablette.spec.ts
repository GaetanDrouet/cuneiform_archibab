import { TestBed } from '@angular/core/testing';
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
});
