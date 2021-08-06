import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';

import { IAlbum } from '../interfaces/IAlbum';
import { IMember } from '../interfaces/IMember';
import { IRound } from '../interfaces/IRound';

import { AlbumService } from '../album.service';
import { MemberService } from '../member.service';

@Component({
  selector: 'app-round-info',
  templateUrl: './round-info.component.html',
  styleUrls: ['./round-info.component.css']
})
export class RoundInfoComponent implements OnInit {

  selectedAlbum: IAlbum;
  participants: IMember[];

  @Input() round: IRound;

  constructor(
    private albumService: AlbumService,
    private memberService: MemberService
  ) { }

  ngOnInit(): void {
    this.selectedAlbum = null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('round' in changes) {
      this.selectedAlbum = null;
      this.loadParticipants();
    }
  }

  selectAlbum(newSelectedAlbum: any): void {
    this.selectedAlbum = newSelectedAlbum;
  }

  async loadParticipants(): Promise<void> {
    this.participants = [];
    for (let albumId of this.round.albumIds) {
      const album: IAlbum = await this.albumService.getAlbumById(albumId).toPromise();
      const poster: IMember = await this.memberService.getMemberById(album.posterId).toPromise();
      this.participants.push(poster);
    }

    // Sort participants by last name, first name
    this.participants.sort((a, b) => {
      if (a.lastName < b.lastName)
        return -1;
      else if (a.lastName > b.lastName)
        return 1;
      return a.firstName < b.firstName ? -1 : 1;
    });
  }

}
