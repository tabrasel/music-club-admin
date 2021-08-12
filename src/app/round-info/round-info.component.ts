import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';

import { IAlbum } from '../interfaces/IAlbum';
import { IMember } from '../interfaces/IMember';
import { IRound } from '../interfaces/IRound';

import { ModelService } from '../model.service';

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
    private modelService: ModelService
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

  loadParticipants(): void {
    if (this.round === null) return;

    this.participants = [];
    for (let albumId of this.round.albumIds) {
      this.modelService.getAlbum(albumId).subscribe(album => {
        this.modelService.getMember(album.posterId).subscribe(poster => {
          this.participants.push(poster);

          // TODO: do this once after all participants are loaded rather than each time
          // Sort participants by last name, first name
          this.participants = this.participants.sort((a, b) => {
            if (a.lastName < b.lastName)
              return -1;
            else if (a.lastName > b.lastName)
              return 1;
            return a.firstName < b.firstName ? -1 : 1;
          });
        });
      });
    }
  }

}
