import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { IAlbum } from './interfaces/IAlbum';
import { IMember } from './interfaces/IMember';
import { IRound } from './interfaces/IRound';

@Injectable({
  providedIn: 'root'
})
export class ModelService {

  hostUrl: string = 'http://localhost:80/'; // Use when running Angular app locally
  //hostUrl: string = '/'; // Use when running Angular app remotely

  constructor(
    private httpClient: HttpClient
  ) { }

  // Round model ///////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Creates a round.
   */
  createRound(roundInfo: any): Observable<IRound> {
    return this.httpClient.post<any>(this.hostUrl + 'api/round', roundInfo);
  }

  /**
   * Updates a round.
   */
  updateRound(id: string, updatedData: any): Observable<IRound> {
    return this.httpClient.put<IRound>(this.hostUrl + 'api/round?id=' + id, updatedData);
  }

  /**
   * Delete a round.
   */
   async deleteRound(roundToDelete: IRound): Promise<Observable<IRound>> {
    // Remove the round from its participants' list of participated rounds
    for (let albumId of roundToDelete.albumIds) {
      this.getAlbum(albumId).subscribe(album => {
        this.getMember(album.posterId).subscribe(poster => {
          const posterNewData: any = {
            participatedRoundIds: poster.participatedRoundIds.filter(roundId => roundId !== roundToDelete.id)
          };
          this.updateMember(poster.id, posterNewData).subscribe();
        });
      });
    }

    // Delete all albums in the round
    for (let albumId of roundToDelete.albumIds) {
      this.getAlbum(albumId).subscribe(albumToDelete => {
        this.deleteAlbum(albumToDelete, roundToDelete).subscribe();
      });
    }

    // Delete the round from the database
    return this.httpClient.delete<any>(this.hostUrl + 'api/round?id=' + roundToDelete.id);
  }

  /**
   * Gets a round.
   */
  getRound(id: string): Observable<IRound> {
    return this.httpClient.get<IRound>(this.hostUrl + 'api/round?id=' + id);
  }

  /**
   * Gets all rounds.
   */
  getAllRounds(): Observable<IRound[]> {
    return this.httpClient.get<IRound[]>(this.hostUrl + 'api/rounds');
  }

  // Album model ///////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Creates an album.
   * @param albumInfo information describing the album
   * @param round     the round the album should be posted to
   * @return a new album
   */
  async createAlbum(albumInfo: any, round: IRound) {
    // Create album in database
    const newAlbum: IAlbum = await this.httpClient.post<any>(this.hostUrl + 'api/album', albumInfo).toPromise();

    // Add album to poster's list of posted albums and add round to the poster's list of participated rounds
    this.getMember(albumInfo.posterId).subscribe(poster => {
      poster.participatedRoundIds.push(round.id);
      poster.postedAlbumIds.push(newAlbum.id);

      const posterNewData = {
        participatedRoundIds: poster.participatedRoundIds,
        postedAlbumIds: poster.postedAlbumIds
      };

      this.updateMember(poster.id, posterNewData).subscribe();
    })

    // Add album to its round
    round.albumIds.push(newAlbum.id);
    this.updateRound(round.id, { albumIds: round.albumIds }).subscribe();

    // TODO: Update the album's round list item to include the album
    /*
    const roundListItems: any = this.roundViewService.roundListItems$.value;
    for (let roundListItem of roundListItems) {
      if (roundListItem.round.id === round.id) {
        roundListItem.albums.push(newAlbum);
        this.roundViewService.roundListItems$.next(roundListItem);
      }
    }
    */

    return newAlbum;
  }

  /**
   * Updates an album.
   * @param id          the id of the album to update
   * @param updatedData the updated album values
   */
  updateAlbum(id: string, updatedData: any): Observable<IAlbum> {
    // TODO: Update original and new poster's posted albums
    return this.httpClient.put<IAlbum>(this.hostUrl + 'api/album?id=' + id, updatedData);
  }

  /**
   * Deletes an album.
   * @param albumToDelete the album to delete
   * @param round         the round the album should be deleted from
   */
  deleteAlbum(albumToDelete: IAlbum, round: IRound): Observable<IAlbum> {
    // Remove the album from the round it was posted in
    const roundNewData: any = {
      albumIds: round.albumIds.filter(albumId => albumId != albumToDelete.id)
    };
    this.updateRound(round.id, roundNewData).subscribe();

    // Remove the album from it's poster's list of posted albums
    this.getMember(albumToDelete.posterId).subscribe(poster => {
      const posterNewData: any = {
        postedAlbumIds: poster.postedAlbumIds.filter(albumId => albumId !== albumToDelete.id)
      };
      this.updateMember(poster.id, posterNewData).subscribe();
    });

    // Delete the album from the database
    return this.httpClient.delete<IAlbum>(this.hostUrl + 'api/album?id=' + albumToDelete.id);
  }

  /**
   * Gets an album.
   * @param id ID of the album to get
   */
  getAlbum(id: string): Observable<IAlbum> {
    return this.httpClient.get<IAlbum>(this.hostUrl + 'api/album?id=' + id);
  }

  /**
   * Deletes a picked track.
   */
  deletePickedTrack(pickedTrackToDelete: any, album: IAlbum): void {
    const newData: any = {
      pickedTracks: album.pickedTracks.filter(pickedTrack => pickedTrack.trackNumber !== pickedTrackToDelete.trackNumber)
    };
    this.updateAlbum(album.id, newData).subscribe();
  }

  // Member model //////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Creates a new member.
   * @param firstName the first name of the new member
   * @param lastName the last name of the new member
   */
  createMember(firstName: string, lastName: string): Observable<IMember> {
    const memberInfo: any = { firstName: firstName, lastName: lastName };
    return this.httpClient.post<IMember>(this.hostUrl + 'api/member', memberInfo);
  }

  /**
   * Updates a member.
   * @param id      the ID of the member to update
   * @param newData an object of updated member values
   */
  updateMember(id: string, newData: any): Observable<IMember> {
    return this.httpClient.put<IMember>(this.hostUrl + 'api/member?id=' + id, newData);
  }

  /**
   * Deletes a member.
   * @param id the ID of the member to delete
   */
  deleteMember(id: string): Observable<IMember> {
    // TODO: Delete all the member's posted albums and picked track selections

    // Delete the member from the database
    return this.httpClient.delete<IMember>(this.hostUrl + 'api/member?id=' + id);
  }

  /**
   * Gets a member.
   * @param id the ID of the member to get.
   */
  getMember(id: string): Observable<IMember> {
    return this.httpClient.get<IMember>(this.hostUrl + 'api/member?id=' + id);
  }

  /**
   * Gets all members.
   */
  getAllMembers(): Observable<IMember[]> {
    return this.httpClient.get<IMember[]>(this.hostUrl + 'api/members');
  }

  /**
   * Compares two members by name.
   */
  compareMembers(m1: IMember, m2: IMember): number {
    if (m1.lastName < m2.lastName)
      return -1;
    else if (m1.lastName > m2.lastName)
      return 1;
    return m1.firstName < m2.firstName ? -1 : 1;
  }

}
