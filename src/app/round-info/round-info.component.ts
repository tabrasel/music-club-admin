import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';

import { IAlbum } from '../interfaces/IAlbum';
import { IRound } from '../interfaces/IRound';

@Component({
  selector: 'app-round-info',
  templateUrl: './round-info.component.html',
  styleUrls: ['./round-info.component.css']
})
export class RoundInfoComponent implements OnInit {

  selectedAlbum: IAlbum;

  @Input() round: IRound;

  constructor() { }

  ngOnInit(): void {
    this.selectedAlbum = null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('round' in changes) {
      this.selectedAlbum = null;
    }
  }

  selectAlbum(newSelectedAlbum: any): void {
    this.selectedAlbum = newSelectedAlbum;
  }

}
