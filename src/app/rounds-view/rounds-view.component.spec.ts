import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoundsViewComponent } from './rounds-view.component';

describe('RoundsViewComponent', () => {
  let component: RoundsViewComponent;
  let fixture: ComponentFixture<RoundsViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RoundsViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RoundsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
