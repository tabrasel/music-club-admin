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

  hostUrl: string = 'http://localhost:80/'; // Use when running backend service locally
  //hostUrl: string = 'https://tb-music-club.herokuapp.com/'; // Use when running backend service remotely

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

      const album: IAlbum = await this.getAlbum(albumId).toPromise();
      const poster: IMember = await this.getMember(album.posterId).toPromise();
      const posterNewData: any = {
        participatedRoundIds: poster.participatedRoundIds.filter(roundId => roundId !== roundToDelete.id)
      };
    }

    // Delete all albums in the round
    for (let albumId of roundToDelete.albumIds) {
      const albumToDelete: IAlbum = await this.getAlbum(albumId).toPromise();
      await this.deleteAlbum(albumToDelete, roundToDelete);
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
   * @param spotifyId Spotify ID of the album
   * @param posterId  member ID of the album poster
   * @param round     the round the album should be posted to
   * @return a new album
   */
  async createAlbum(spotifyId: string, posterId: string, round: IRound): Promise<IAlbum> {
    // Create album in database
    const albumParams: any = { spotifyId, posterId };
    const createdAlbum: IAlbum = await this.httpClient.post<any>(this.hostUrl + 'api/album', albumParams).toPromise();

    // Add album to poster's list of posted albums and add round to the poster's list of participated rounds
    const poster: IMember = await this.getMember(posterId).toPromise();

    poster.participatedRoundIds.push(round.id);
    poster.postedAlbumIds.push(createdAlbum.id);

    const posterNewData = {
      participatedRoundIds: poster.participatedRoundIds,
      postedAlbumIds: poster.postedAlbumIds
    };

    this.updateMember(posterId, posterNewData).subscribe();

    // Add album to its round
    round.albumIds.push(createdAlbum.id);
    this.updateRound(round.id, { albumIds: round.albumIds }).subscribe();

    return createdAlbum;
  }

  /**
   * Updates an album.
   * @param id          the id of the album to update
   * @param updatedData the updated album values
   */
  async updateAlbum(id: string, updateData: any): Promise<IAlbum> {
    // TODO: Update original and new poster's posted albums
    return this.httpClient.put<IAlbum>(`${this.hostUrl}api/album?id=${id}`, updateData).toPromise();
  }

  /**
   * Deletes an album.
   * @param albumToDelete the album to delete
   * @param round         the round the album should be deleted from
   */
  async deleteAlbum(albumToDelete: IAlbum, round: IRound): Promise<IAlbum> {
    // Remove the album from the round it was posted in
    const roundNewData: any = {
      albumIds: round.albumIds.filter(albumId => albumId != albumToDelete.id)
    };
    this.updateRound(round.id, roundNewData).subscribe();

    // Remove the album from it's poster's list of posted albums
    const poster: IMember = await this.getMember(albumToDelete.posterId).toPromise();
    const posterNewData: any = {
      postedAlbumIds: poster.postedAlbumIds.filter(albumId => albumId !== albumToDelete.id)
    };
    this.updateMember(poster.id, posterNewData).subscribe();

    // Delete the album from the database
    return this.httpClient.delete<IAlbum>(`${this.hostUrl}api/album?id=${albumToDelete.id}`).toPromise();
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
    this.updateAlbum(album.id, newData);
  }

  // Member model //////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Creates a new member.
   * @param firstName the first name of the new member
   * @param lastName the last name of the new member
   */
  createMember(firstName: string, lastName: string, color: string): Observable<IMember> {
    const memberInfo: any = { firstName: firstName, lastName: lastName, color: color };
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
