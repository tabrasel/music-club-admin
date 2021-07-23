import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { RoundsViewComponent } from './rounds-view/rounds-view.component';

const routes: Routes = [
  { path: '', component: RoundsViewComponent },
  { path: 'rounds', component: RoundsViewComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
