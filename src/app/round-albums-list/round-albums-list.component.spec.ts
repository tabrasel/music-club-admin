import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoundAlbumsListComponent } from './round-albums-list.component';

describe('RoundAlbumsListComponent', () => {
  let component: RoundAlbumsListComponent;
  let fixture: ComponentFixture<RoundAlbumsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RoundAlbumsListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RoundAlbumsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
