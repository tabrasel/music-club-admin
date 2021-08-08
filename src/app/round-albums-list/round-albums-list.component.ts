import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

// Import model interfaces
import { IAlbum } from '../interfaces/IAlbum';
import { IMember } from '../interfaces/IMember';
import { IRound } from '../interfaces/IRound';

import { AlbumService } from '../album.service';
import { MemberService } from '../member.service';
import { RoundService } from '../round.service';

interface IAlbumForm {
  title: string;
  artist: string;
  trackCount: number;
  imageUrl: string;
  posterName: string;
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
  posterOptions: string[];

  @Input() round: IRound;

  @Output() albumSelectEvent = new EventEmitter<IAlbum>();

  constructor(
    private formBuilder: FormBuilder,
    private albumService: AlbumService,
    private memberService: MemberService,
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

    // List all members as poster options
    this.memberService.getAllMembers().subscribe(allMembers => {
      this.posterOptions = [];
      for (let member of allMembers) {
        this.posterOptions.push(member.firstName + ' ' + member.lastName);
      }      
    });

    this.albumListItems = [];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('round' in changes) {
      this.selectedAlbum = null;
      this.loadAlbumListItems();
    }
  }

  async loadAlbumListItems(): Promise<void> {
    this.albumListItems = [];

    for (let albumId of this.round.albumIds) {
      const album: IAlbum = await this.albumService.getAlbumById(albumId).toPromise();
      const albumListItem: IAlbumListItem = await this.createAlbumListItem(album);
      this.albumListItems.push(albumListItem);
    }

    // Sort album list items by poster name
    this.albumListItems = this.albumListItems.sort((a, b) => {
      if (a.poster.lastName < b.poster.lastName)
        return -1;
      else if (a.poster.lastName > b.poster.lastName)
        return 1;
      return a.poster.firstName < b.poster.firstName ? -1 : 1;
    });
  }

  async createAlbumListItem(album: IAlbum): Promise<IAlbumListItem> {
    // Get the album's poster
    const poster: IMember = await this.memberService.getMemberById(album.posterId).toPromise();

    // TODO: Update round list item icon to include album image

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
    const album: IAlbum = await this.albumService.createAlbum(form, this.round);

    // Create the album list item
    const albumListItem: IAlbumListItem = await this.createAlbumListItem(album);

    // Add the album list item to the list
    this.albumListItems.push(albumListItem);

    // Sort album list items by title
    this.albumListItems = this.albumListItems.sort((a, b) => a.poster.lastName > b.poster.lastName ? -1 : 1);

    // Close the album form modal
    document.getElementById('album-modal-close-button').click();
  }

  async deleteAlbum(deletedAlbum: IAlbum): Promise<void> {
    // Don't click any elements under the delete button
    event.stopPropagation();

    if (!confirm('Really delete "' + deletedAlbum.title + '"?')) return;

    // TODO: Delete the album from the database
    const foo = await this.albumService.deleteAlbum(deletedAlbum, this.round);

    // Remove the album's list item
    this.albumListItems = this.albumListItems.filter(albumListItem => albumListItem.album.id != deletedAlbum.id);
  }

  clearAlbumForm(): void {
    this.albumForm.reset();
  }

}
