import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseBrowsing } from './course-browsing';

describe('CourseBrowsing', () => {
  let component: CourseBrowsing;
  let fixture: ComponentFixture<CourseBrowsing>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseBrowsing]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseBrowsing);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
