import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

// Import model interfaces
import { IAlbum } from '../interfaces/IAlbum';
import { IMember } from '../interfaces/IMember';
import { IRound } from '../interfaces/IRound';

import { ModelService } from '../model.service';

interface IAlbumForm {
  title: string;
  artist: string;
  trackCount: number;
  imageUrl: string;
  posterId: string;
}

interface IAlbumListItem {
  album: IAlbum,
  poster: IMember
}

@Component({
  selector: 'app-round-albums-list',
  templateUrl: './round-albums-list.component.html',
  styleUrls: ['./round-albums-list.component.css']
})
export class RoundAlbumsListComponent implements OnInit {

  albumForm: FormGroup;
  albumListItems: IAlbumListItem[];
  selectedAlbum: IAlbum;
  allMembers: IMember[];

  @Input() round: IRound;

  @Output() albumSelectEvent = new EventEmitter<IAlbum>();

  constructor(
    private formBuilder: FormBuilder,
    private modelService: ModelService
  ) { }

  ngOnInit(): void {
    // Define the album form
    this.albumForm = this.formBuilder.group({
      title: [null, Validators.required],
      artist: [null, Validators.required],
      trackCount: [null, Validators.required],
      imageUrl: [null, Validators.required],
      posterId: [null, Validators.required]
    });

    // List all members as poster options
    this.allMembers = [];
    this.modelService.getAllMembers().subscribe(allMembers => {
      // Sort all members name
      this.allMembers = allMembers.sort((a, b) => {
        if (a.lastName < b.lastName)
          return -1;
        else if (a.lastName > b.lastName)
          return 1;
        return a.firstName < b.firstName ? -1 : 1;
      });
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('round' in changes) {
      this.selectedAlbum = null;
      this.loadAlbumListItems();
    }
  }

  async loadAlbumListItems(): Promise<void> {
    this.albumListItems = [];

    // Create promises for album list items
    const albumListItemPromises: Promise<IAlbumListItem>[] = this.round.albumIds.map(async albumId => {
      const album: IAlbum = await this.modelService.getAlbum(albumId).toPromise();
      return this.createAlbumListItem(album);
    });

    // Once all album list items have been created
    Promise.all(albumListItemPromises).then(albumListItems => {
      // Sort the temporary list of album list items by poster name
      this.albumListItems = albumListItems.sort((a, b) => {
        if (a.poster.lastName < b.poster.lastName)
          return -1;
        else if (a.poster.lastName > b.poster.lastName)
          return 1;
        return a.poster.firstName < b.poster.firstName ? -1 : 1;
      });
    });
  }

  async createAlbumListItem(album: IAlbum): Promise<IAlbumListItem> {
    // Get the album's poster
    const poster: IMember = await this.modelService.getMember(album.posterId).toPromise();

    // Create the album list item
    const albumListItem: IAlbumListItem = {
      album: album,
      poster: poster
    };

    return albumListItem;
  }

  selectAlbumListItem(albumListItem: IAlbumListItem): void {
    this.selectedAlbum = albumListItem.album;
    this.albumSelectEvent.emit(albumListItem.album);
  }

  async submitAlbumForm(): Promise<void> {
    const form: IAlbumForm = this.albumForm.value as IAlbumForm;

    // Create the album
    const album: IAlbum = await this.modelService.createAlbum(form, this.round);

    // Create the album list item
    const albumListItem: IAlbumListItem = await this.createAlbumListItem(album);

    // Add the album list item to the list
    this.albumListItems.push(albumListItem);

    // Sort album list items by poster name
    this.albumListItems = this.albumListItems.sort((a, b) => {
      if (a.poster.lastName < b.poster.lastName)
        return -1;
      else if (a.poster.lastName > b.poster.lastName)
        return 1;
      return a.poster.firstName < b.poster.firstName ? -1 : 1;
    });

    // TODO: Update round list item icon to include album image

    // Close the album form modal
    document.getElementById('album-modal-close-button').click();
  }

  deleteAlbum(deletedAlbum: IAlbum): void {
    // Don't click any elements under the delete button
    event.stopPropagation();

    if (!confirm('Really delete "' + deletedAlbum.title + '"?')) return;

    // Delete the album from the database
    this.modelService.deleteAlbum(deletedAlbum, this.round).subscribe();

    // Remove the album's list item
    this.albumListItems = this.albumListItems.filter(albumListItem => albumListItem.album.id != deletedAlbum.id);
  }

  clearAlbumForm(): void {
    this.albumForm.reset();
  }

}
