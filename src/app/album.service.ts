import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { IAlbum } from './interfaces/IAlbum';
import { IMember } from './interfaces/IMember';
import { IRound } from './interfaces/IRound';

import { MemberService } from './member.service';
import { RoundService } from './round.service';

@Injectable({
  providedIn: 'root'
})
export class AlbumService {

  hostUrl: string = 'http://localhost:80/'; // Use when running Angular app locally
  //hostUrl: string = '/'; // Use when running Angular app remotely

  constructor(
    private httpClient: HttpClient,
    private memberService: MemberService,
    private roundService: RoundService
  ) { }

  async createAlbum(albumInfo: any, round: IRound) {
    // Create new poster if the poster name doesn't exist in the database
    const posterFirstName: string = albumInfo.posterName.split(' ')[0].trim();
    const posterLastName: string = albumInfo.posterName.split(' ')[1].trim();
    let poster: IMember = await this.memberService.getMemberByName(posterFirstName, posterLastName).toPromise();

    // If this is a new poster, create them as a member in the database
    if (poster === null) {
      poster = await this.memberService.createMember(posterFirstName, posterLastName).toPromise();
    }

    // Add the poster ID to the album info
    albumInfo['posterId'] = poster.id;

    // Create new album in database
    const newAlbum = await this.httpClient.post<any>(this.hostUrl + 'api/album', albumInfo).toPromise();

    // Add album to poster's list of posted albums
    // Add round to the poster's list of participated rounds
    poster.participatedRoundIds.push(round.id);
    poster.postedAlbumIds.push(newAlbum.id);
    const posterNewData = {
      participatedRoundIds: poster.participatedRoundIds,
      postedAlbumIds: poster.postedAlbumIds
    };
    await this.memberService.updateMember(poster.id, posterNewData).toPromise();

    // Add new album to its round
    round.albumIds.push(newAlbum.id);
    await this.roundService.updateRound(round.id, { albumIds: round.albumIds }).toPromise();

    return newAlbum;
  }

  updateAlbum(id: string, updatedData: any): any {
    return this.httpClient.put<any>(this.hostUrl + 'api/album?id=' + id, updatedData);
  }

  async deletePickedTrack(deletedPickedTrack: any, album: IAlbum): Promise<void> {
    const newPickedTracks: any[] = album.pickedTracks.filter(pickedTrack => pickedTrack.trackNumber !== deletedPickedTrack.trackNumber);
    const newAlbumData: any = { pickedTracks: newPickedTracks };
    await this.updateAlbum(album.id, newAlbumData).toPromise();
  }

  async deleteAlbum(deletedAlbum: IAlbum, round: IRound) {
    // Remove the album from it's round
    round.albumIds = round.albumIds.filter(albumId => albumId != deletedAlbum.id);
    await this.roundService.updateRound(round.id, { albumIds: round.albumIds }).toPromise();

    // Remove the album from it's poster's posted albums
    const poster: IMember = await this.memberService.getMemberById(deletedAlbum.posterId).toPromise();
    const posterNewPostedAlbumIds: string[] = poster.postedAlbumIds.filter(albumId => albumId !== deletedAlbum.id);
    await this.memberService.updateMember(poster.id, { postedAlbumIds: posterNewPostedAlbumIds }).toPromise();

    // Delete the album's poster from the database if it was the only post they made
    if (posterNewPostedAlbumIds.length === 0) {
      this.memberService.deleteMember(poster).subscribe();
    }

    // Delete the album from the database
    this.httpClient.delete<any>(this.hostUrl + 'api/album?id=' + deletedAlbum.id).subscribe();

    return deletedAlbum;
  }

  getAlbumById(id: string): any {
    return this.httpClient.get<IAlbum>(this.hostUrl + 'api/album?id=' + id);
  }

}
