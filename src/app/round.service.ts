import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { IRound } from './interfaces/IRound';

@Injectable({
  providedIn: 'root'
})
export class RoundService {

  hostUrl: string = 'http://localhost:80/'; // Use when running Angular app locally
  //hostUrl: string = '/'; // Use when running Angular app remotely

  constructor(private httpClient: HttpClient) { }

  createRound(roundInfo: any) {
    return this.httpClient.post<any>(this.hostUrl + 'api/round', roundInfo);
  }

  updateRound(id: string, updatedData: any): any {
    return this.httpClient.put<any>(this.hostUrl + 'api/round?id=' + id, updatedData);
  }

  getRoundbyId(id: string): any {
    return this.httpClient.get<IRound>(this.hostUrl + 'api/round?id=' + id);
  }

  getAllRounds(): any {
    return this.httpClient.get<IRound[]>(this.hostUrl + 'api/rounds');
  }
}
