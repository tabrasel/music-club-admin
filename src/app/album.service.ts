import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { IAlbum } from './interfaces/IAlbum';
import { IRound } from './interfaces/IRound';

import { RoundService } from './round.service';

@Injectable({
  providedIn: 'root'
})
export class AlbumService {

  hostUrl: string = 'http://localhost:80/'; // Use when running Angular app locally
  //hostUrl: string = '/'; // Use when running Angular app remotely

  constructor(
    private httpClient: HttpClient,
    private roundService: RoundService
  ) { }

  async createAlbum(albumInfo: any, round: IRound) {
    // Create new album in database
    const newAlbum = await this.httpClient.post<any>(this.hostUrl + 'api/album', albumInfo).toPromise();

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
