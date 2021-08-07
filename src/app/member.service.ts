import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { IMember } from './interfaces/IMember';

@Injectable({
  providedIn: 'root'
})
export class MemberService {

  hostUrl: string = 'http://localhost:80/'; // Use when running Angular app locally
  //hostUrl: string = '/'; // Use when running Angular app remotely

  constructor(
    private httpClient: HttpClient
  ) { }

  createMember(firstName: string, lastName: string) {
    const memberInfo: any = {
      firstName: firstName,
      lastName: lastName
    }

    return this.httpClient.post<any>(this.hostUrl + 'api/member', memberInfo);
  }

  updateMember(id: string, updatedData: any): any {
    return this.httpClient.put<any>(this.hostUrl + 'api/member?id=' + id, updatedData);
  }

  deleteMember(deletedMember: IMember) {
    // Delete the album from the database
    return this.httpClient.delete<any>(this.hostUrl + 'api/member?id=' + deletedMember.id);
  }

  getMemberById(id: string): any {
    return this.httpClient.get<IMember>(this.hostUrl + 'api/member?id=' + id);
  }

  getMemberByName(firstName: string, lastName: string): any {
    return this.httpClient.get<IMember>(this.hostUrl + 'api/member?firstName=' + firstName + '&lastName=' + lastName);
  }
}
