import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

// Import model interfaces
import { IAlbum } from '../interfaces/IAlbum';
import { IMember } from '../interfaces/IMember';
import { IRound } from '../interfaces/IRound';

import { RoundService } from '../round.service';

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

  albumForm: FormGroup;

  albumListItems: IAlbum[];

  selectedRound: IRound;
  selectedAlbum: IAlbum;

  selectedRoundAlbums: IAlbum[];

  constructor(
    private roundService: RoundService
  ) { }

  ngOnInit(): void {
    this.selectedRound = null;
    this.selectedAlbum = null;
  }

  selectRound(newSelectedRound: any): void {
    this.selectedRound = newSelectedRound;
  }

}
