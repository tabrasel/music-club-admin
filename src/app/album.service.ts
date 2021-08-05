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

    // TODO: Add album to poster's list of posted albums
    poster.postedAlbumIds.push(newAlbum.id);
    await this.memberService.updateMember(poster.id, { postedAlbumIds: poster.postedAlbumIds }).toPromise();

    // Add new album to its round
    round.albumIds.push(newAlbum.id);
    await this.roundService.updateRound(round.id, { albumIds: round.albumIds }).toPromise();

    return newAlbum;
  }

  updateAlbum(id: string, updatedData: any): any {
    return this.httpClient.put<any>(this.hostUrl + 'api/album?id=' + id, updatedData);
  }

  async deleteAlbum(deletedAlbum: IAlbum, round: IRound) {
    // Remove the album from it's round
    round.albumIds = round.albumIds.filter(albumId => albumId != deletedAlbum.id);
    await this.roundService.updateRound(round.id, { albumIds: round.albumIds }).toPromise();

    // TODO: Remove the album from it's poster's posted albums

    // TODO: Delete the album's poster from the database if it was the only post they made

    // Delete the album from the database
    alert('deleting with ' + this.hostUrl + 'api/album?id=' + deletedAlbum.id);
    await this.httpClient.delete<any>(this.hostUrl + 'api/album?id=' + deletedAlbum.id).toPromise();

    return deletedAlbum;
  }

  getAlbumById(id: string): any {
    return this.httpClient.get<IAlbum>(this.hostUrl + 'api/album?id=' + id);
  }

}
