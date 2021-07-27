import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

// Import model interfaces
import { IAlbum } from '../interfaces/IAlbum';
import { IMember } from '../interfaces/IMember';
import { IRound } from '../interfaces/IRound';

import { AlbumService } from '../album.service';
import { RoundService } from '../round.service';

interface IAlbumForm {
  title: string;
  artist: string;
  trackCount: number;
  imageUrl: string;
  posterName: string;
}

interface IAlbumListItem {
  album: IAlbum
}

@Component({
  selector: 'app-round-albums-list',
  templateUrl: './round-albums-list.component.html',
  styleUrls: ['./round-albums-list.component.css']
})
export class RoundAlbumsListComponent implements OnInit {

  albumForm: FormGroup;
  albumListItems: IAlbumListItem[];

  @Input() round: IRound;

  @Output() albumSelectEvent = new EventEmitter<IAlbum>();

  constructor(
    private formBuilder: FormBuilder,
    private albumService: AlbumService,
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

    this.albumListItems = [];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('round' in changes) {
      this.loadAlbumListItems();
    }
  }

  async loadAlbumListItems(): Promise<void> {
    this.albumListItems = [];

    for (let albumId of this.round.albumIds) {
      const loadedAlbum: IAlbum = await this.albumService.getAlbumById(albumId).toPromise();

      const loadedAlbumListItem: IAlbumListItem = {
        album: loadedAlbum
      };

      this.albumListItems.push(loadedAlbumListItem);
    }
  }

  selectAlbumListItem(albumListItem: IAlbumListItem): void {
    this.albumSelectEvent.emit(albumListItem.album);
  }

  async submitAlbumForm(): Promise<void> {
    const form: IAlbumForm = this.albumForm.value as IAlbumForm;

    // Create the album in the database
    const newAlbum: IAlbum = await this.albumService.createAlbum(form).toPromise();

    // Add album to the selected round
    this.round.albumIds.push(newAlbum.id);
    await this.roundService.updateRound(this.round.id, { albumIds: this.round.albumIds }).toPromise();

    // TODO: Update round list item icon to include album image

    // Create a list item for the album
    const newAlbumListItem: IAlbumListItem = {
      album: newAlbum
    };

    // Add the album list item to the list
    this.albumListItems.push(newAlbumListItem);

    // Sort album list items by title
    //this.albumListItems = this.albumListItems.sort((a, b) => a.album.title > b.round.number ? -1 : 1);

    // Close the album form modal
    document.getElementById('modal-close-button').click();
  }

  clearAlbumForm(): void {
    this.albumForm.reset();
  }

}
