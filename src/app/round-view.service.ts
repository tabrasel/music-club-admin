import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from "rxjs";

import { IAlbum } from './interfaces/IAlbum';
import { IRound } from './interfaces/IRound';
import { IMember } from './interfaces/IMember';

import { ModelService } from './model.service';

interface IRoundListItem {
  round: IRound;
  albums: IAlbum[];
  members: IMember[];
}

@Injectable({
  providedIn: 'root'
})
export class RoundViewService {

  selectedRound: IRound;

  roundListItems$ = new BehaviorSubject<IRoundListItem[]>([]);

  roundListItemsChange = this.roundListItems$.asObservable();

  constructor(
    private modelService: ModelService
  ) {
    this.selectedRound = null;

    this.createAllRoundListItems();
  }

  selectRound(round: IRound): any {
    this.selectedRound = round;
  }

  async createAllRoundListItems(): Promise<void> {
    let roundListItems: IRoundListItem[] = [];

    const allRounds = await this.modelService.getAllRounds().toPromise();

    for (let round of allRounds) {
      // Load the albums in the round
      const albums: IAlbum[] = [];
      for (let albumId of round.albumIds) {
        const album: IAlbum = await this.modelService.getAlbum(albumId).toPromise();
        albums.push(album);
      }

      // Load the participants in the round
      const participants: IMember[] = [];
      for (let album of albums) {
        const participant: IMember = await this.modelService.getMember(album.posterId).toPromise();
        participants.push(participant);
      }

      // TODO: Order round albums by poster name
      // TODO: Order round posters by name

      const roundListItem: IRoundListItem = {
        round: round,
        albums: albums,
        members: participants
      };

      roundListItems.push(roundListItem);
    }

    // Sort round list items by descending round number
    roundListItems = roundListItems.sort((a, b) => a.round.number > b.round.number ? -1 : 1);

    this.roundListItems$.next(roundListItems);
  }

}
