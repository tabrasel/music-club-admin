import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoundsListComponent } from './rounds-list.component';

describe('RoundsListComponent', () => {
  let component: RoundsListComponent;
  let fixture: ComponentFixture<RoundsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RoundsListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RoundsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
