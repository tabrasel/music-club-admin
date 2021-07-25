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

  roundForm: FormGroup;
  albumForm: FormGroup;

  albumListItems: IAlbum[];

  selectedRound: IRound;
  selectedAlbum: IAlbum;

  selectedRoundAlbums: IAlbum[];

  constructor(
    private formBuilder: FormBuilder,
    private roundService: RoundService
  ) { }

  ngOnInit(): void {
    // Define the album form
    this.albumForm = this.formBuilder.group({
      title: [null, Validators.required],
      artist: [null, Validators.required],
      trackCount: [null, Validators.required],
      imageUrl: [null, Validators.required],
      posterName: [null, Validators.required]
    });

    this.selectedRound = null;
    this.selectedAlbum = null;
  }

  selectAlbumListItem(albumListItem: IAlbum): void {
    this.selectedAlbum = albumListItem;
    //alert(this.selectedAlbum.title);
    //this.pickedTrackListItems =
  }

  async submitAlbumForm(): Promise<void> {
    alert('submitted');
  }

  clearAlbumForm(): void {
    this.albumForm.reset();
  }

}
