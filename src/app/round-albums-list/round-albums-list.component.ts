import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

// Import model interfaces
import { IAlbum } from '../interfaces/IAlbum';
import { IMember } from '../interfaces/IMember';
import { IRound } from '../interfaces/IRound';

import { ModelService } from '../model.service';
import { RoundListItemsService } from '../round-list-items.service';

interface IAlbumForm {
  albumQuery: string;
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

  albumSearchForm: FormGroup;
  albumForm: FormGroup;
  albumListItems: IAlbumListItem[];
  selectedAlbum: IAlbum;
  allMembers: IMember[];
  albumToUpdateId: string;
  searchAlbumListItems: any[];

  @Input() round: IRound;
  @Input() participants: IMember[];
  @Output() albumSelectEvent = new EventEmitter<IAlbum>();

  constructor(
    private formBuilder: FormBuilder,
    private modelService: ModelService,
    private roundListItemsService: RoundListItemsService,
    private httpClient: HttpClient
  ) { }

  ngOnInit(): void {
    // Define the album search form
    this.albumSearchForm = this.formBuilder.group({
      query: [null, Validators.required]
    });

    // Define the album form
    this.albumForm = this.formBuilder.group({
      albumQuery: [null, Validators.required],
      posterId: [null, Validators.required]
    });

    // List all members as poster options
    this.allMembers = [];
    this.modelService.getAllMembers().subscribe(allMembers => {
      // Sort members by name
      this.allMembers = allMembers.sort((m1, m2) => this.modelService.compareMembers(m1, m2));
    });

    this.albumToUpdateId = null;

    this.albumForm.get('albumQuery').valueChanges.subscribe((query) => {
      this.searchForAlbum(query);
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

    const albumListItems: IAlbumListItem[] = await Promise.all(albumListItemPromises);

    // Sort the temporary list of album list items by poster name
    this.albumListItems = albumListItems.sort((a1, a2) => this.modelService.compareMembers(a1.poster, a2.poster));
    this.selectAlbumListItem(albumListItems[0]);
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
    if (albumListItem === undefined) return;
    this.selectedAlbum = albumListItem.album;
    this.albumSelectEvent.emit(albumListItem.album);
  }

  async submitAlbumForm(): Promise<void> {
    const formValues: IAlbumForm = this.albumForm.value as IAlbumForm;

    if (this.albumToUpdateId === null) {
      this.createAlbum(formValues);
    } else {
      this.updateAlbum(formValues);
    }

    // Close the album form modal
    document.getElementById('album-modal-close-button').click();
  }

  async searchForAlbum(query: string): Promise<any> {
    const searchResults = await this.httpClient.get<any>(`http://localhost:80/api/album-search?q=${query}`).toPromise();
    this.searchAlbumListItems = (searchResults.items.length > 0) ? searchResults.items : [];
    console.log(searchResults);
  }

  async createAlbum(albumInfo: any): Promise<void> {
    // Create the album
    const album: IAlbum = await this.modelService.createAlbum(albumInfo, this.round);

    // Create the album list item
    const albumListItem: IAlbumListItem = await this.createAlbumListItem(album);

    // Add the album list item to the list
    this.albumListItems.push(albumListItem);
    this.sortAlbumListItems();

    // Add the album to its round list item
    this.roundListItemsService.addAlbum(album, this.round);
  }

  async updateAlbum(albumInfo: any): Promise<void> {
    // Update the album in the database
    const updatedAlbum: IAlbum = await this.modelService.updateAlbum(this.albumToUpdateId, albumInfo).toPromise();

    // Update the album in its round list item
    for (let albumListItem of this.albumListItems) {
      if (albumListItem.album.id === this.albumToUpdateId) {
        albumListItem.album = updatedAlbum;
        break;
      }
    }

    // Sort the album list items in case the update changed the poster name
    this.sortAlbumListItems();

    // Refresh the currently selected album
    this.selectedAlbum = updatedAlbum;
    this.albumSelectEvent.emit(updatedAlbum);

    // Update the album in its round list item
    this.roundListItemsService.updateAlbum(updatedAlbum, this.round);

    // Update round
    this.modelService.updateRound(this.round.id, {}).toPromise();

    this.albumToUpdateId = null;
  }

  populateAlbumForm(album: IAlbum): void {
    // Don't click any elements under the edit button
    event.stopPropagation();

    // Set album form values
    this.albumForm.controls.title.setValue(album.title);
    this.albumForm.controls.artist.setValue(album.artist);
    this.albumForm.controls.trackCount.setValue(album.trackCount);
    this.albumForm.controls.imageUrl.setValue(album.imageUrl);
    this.albumForm.controls.posterId.setValue(album.posterId);

    this.albumToUpdateId = album.id;
  }

  async deleteAlbum(deletedAlbum: IAlbum): Promise<void> {
    // Don't click any elements under the delete button
    event.stopPropagation();

    if (!confirm('Really delete "' + deletedAlbum.title + '"?')) return;

    // Delete the album from the database
    await this.modelService.deleteAlbum(deletedAlbum, this.round);

    // Remove the album's list item
    this.albumListItems = this.albumListItems.filter(albumListItem => albumListItem.album.id != deletedAlbum.id);

    // Delete the album from its round list item
    this.roundListItemsService.deleteAlbum(deletedAlbum, this.round);

    // Update round
    this.modelService.updateRound(this.round.id, {}).toPromise();
  }

  clearAlbumForm(): void {
    this.albumForm.reset();
  }

  sortAlbumListItems(): void {
    this.albumListItems = this.albumListItems.sort((a, b) => {
      if (a.poster.lastName < b.poster.lastName)
        return -1;
      else if (a.poster.lastName > b.poster.lastName)
        return 1;
      return a.poster.firstName < b.poster.firstName ? -1 : 1;
    });
  }

}
