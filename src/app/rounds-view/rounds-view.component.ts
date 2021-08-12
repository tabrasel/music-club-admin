import { Component, OnInit } from '@angular/core';

// Import model interfaces
import { IRound } from '../interfaces/IRound';

import { ModelService } from '../model.service';

interface IAlbumForm {
  title: string;
  artist: string;
  trackCount: number;
  imageUrl: string;
  posterName: string;
}

@Component({
  selector: 'app-rounds-view',
  templateUrl: './rounds-view.component.html',
  styleUrls: ['./rounds-view.component.css']
})
export class RoundsViewComponent implements OnInit {

  selectedRound: IRound;

  constructor(
    private modelService: ModelService
  ) { }

  ngOnInit(): void {
    this.selectedRound = null;
  }

  selectRound(newSelectedRound: any): void {
    this.selectedRound = newSelectedRound;
  }

}
