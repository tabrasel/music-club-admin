import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { IAlbum } from './interfaces/IAlbum';
import { IMember } from './interfaces/IMember';
import { IRound } from './interfaces/IRound';

import { ModelService } from './model.service';

import { DateTime } from 'luxon';

interface IRoundListItem {
  round: IRound;
  albums: IAlbum[];
  participants: IMember[];
  startDateStr: string;
}

@Injectable({
  providedIn: 'root'
})
export class RoundListItemsService {

  source: BehaviorSubject<IRoundListItem[]> = new BehaviorSubject<IRoundListItem[]>([]);
  stream: Observable<IRoundListItem[]> = this.source.asObservable();

  constructor(
    private modelService: ModelService
  ) { }

  /**
   * Loads all round list items.
   */
  async loadRoundListItems(): Promise<void> {
    const allRounds = await this.modelService.getAllRounds().toPromise();

    // Create round list items
    const roundListItemPromises: Promise<IRoundListItem>[] = allRounds.map(round => {
      return this.createRoundListItem(round);
    });

    // Get round list items
    const roundListItems: IRoundListItem[] = await Promise.all(roundListItemPromises);

    // Sort items by descending round number
    this.source.next(roundListItems.sort((a, b) => a.round.number > b.round.number ? -1 : 1));
  }

  /**
   * Creates a round list item.
   * @param round the round to create a list item for
   */
  async createRoundListItem(round: IRound): Promise<IRoundListItem> {
    // Load the round albums
    const albums: IAlbum[] = [];
    for (let albumId of round.albumIds) {
      const album: IAlbum = await this.modelService.getAlbum(albumId).toPromise();
      albums.push(album);
    }

    // Get the round participants
    const participantPromises: Promise<IMember>[] = round.participantIds.map(participantId => {
      return this.modelService.getMember(participantId).toPromise();
    });
    const participants: IMember[] = await Promise.all(participantPromises);

    // Sort participants by name
    participants.sort((p1, p2) => this.modelService.compareMembers(p1, p2));

    // Sort albums by poster name
    albums.sort((a1, a2) => {
      const a1Poster: IMember = participants.filter(participant => participant.id === a1.posterId)[0];
      const a2Poster: IMember = participants.filter(participant => participant.id === a2.posterId)[0];
      return this.modelService.compareMembers(a1Poster, a2Poster);
    });

    const startDate = DateTime.fromISO(round.startDate);
    const startDateLabel: string = startDate.toLocaleString(DateTime.DATE_MED);

    const roundListItem: IRoundListItem = {
      round: round,
      albums: albums,
      participants: participants,
      startDateStr: startDateLabel
    };

    return roundListItem;
  }

  /**
   * Adds an album to a round list item.
   */
  addAlbum(album: IAlbum, round: IRound): void {
    const roundListItem: IRoundListItem = this.getRoundListItem(round);

    roundListItem.albums.push(album);
    roundListItem.albums.sort((a1, a2) => {
      const a1Poster: IMember = roundListItem.participants.filter(participant => participant.id === a1.posterId)[0];
      const a2Poster: IMember = roundListItem.participants.filter(participant => participant.id === a2.posterId)[0];
      return this.modelService.compareMembers(a1Poster, a2Poster);
    });
  }

  updateAlbum(album: IAlbum, round: IRound): void {
    const roundListItem: IRoundListItem = this.getRoundListItem(round);

    for (let i = 0; i < roundListItem.albums.length; i++) {
      if (roundListItem.albums[i].id === album.id) {
        roundListItem.albums[i] = album;
        return;
      }
    }
  }

  /**
   * Deletes an album from a round list item.
   */
  deleteAlbum(album: IAlbum, round: IRound): void {
    const roundListItem: IRoundListItem = this.getRoundListItem(round);

    for (let i = 0; i < roundListItem.albums.length; i++) {
      if (roundListItem.albums[i].id === album.id) {
        roundListItem.albums.splice(i, 1);
        return;
      }
    }
  }

  /**
   * Adds a participant to a round list item.
   */
  addParticipant(participant: IMember, round: IRound): void {
    const roundListItem: IRoundListItem = this.getRoundListItem(round);

    roundListItem.participants.push(participant);
    roundListItem.participants.sort((p1, p2) => this.modelService.compareMembers(p1, p2));
  }

  /**
   * Deletes a participant from a round list item.
   */
  deleteParticipant(participantId: string, round: IRound): void {
    const roundListItem: IRoundListItem = this.getRoundListItem(round);

    for (let i = 0; i < roundListItem.participants.length; i++) {
      if (roundListItem.participants[i].id === participantId) {
        roundListItem.participants.splice(i, 1);
        return;
      }
    }
  }

  /**
   * Gets the index of the round list item for the given round.
   */
  getRoundListItemIndex(round: IRound): number {
    for (let i = 0; i < this.source.value.length; i++) {
      const roundListItem = this.source.value[i];
      if (roundListItem.round.id === round.id) return i;
    }
    return -1;
  }

  /**
   * Gets the round list item for the given round.
   */
  getRoundListItem(round: IRound): IRoundListItem {
    for (let roundListItem of this.source.value)
      if (roundListItem.round.id === round.id) return roundListItem;
    return null;
  }
}
