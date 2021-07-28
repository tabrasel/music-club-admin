import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { IAlbum } from './interfaces/IAlbum'

@Injectable({
  providedIn: 'root'
})
export class AlbumService {

  hostUrl: string = 'http://localhost:80/'; // Use when running Angular app locally
  //hostUrl: string = '/'; // Use when running Angular app remotely

  constructor(private httpClient: HttpClient) { }

  createAlbum(albumInfo: any) {
    return this.httpClient.post<any>(this.hostUrl + 'api/album', albumInfo);
  }

  updateAlbum(id: string, updatedData: any): any {
    return this.httpClient.put<any>(this.hostUrl + 'api/album?id=' + id, updatedData);
  }

  getAlbumById(id: string): any {
    return this.httpClient.get<IAlbum>(this.hostUrl + 'api/album?id=' + id);
  }

}
