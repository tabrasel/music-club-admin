import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { RoundsViewComponent } from './rounds-view/rounds-view.component';
import { MembersViewComponent } from './members-view/members-view.component';

const routes: Routes = [
  { path: '', component: RoundsViewComponent },
  { path: 'rounds', component: RoundsViewComponent },
  { path: 'members', component: MembersViewComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
