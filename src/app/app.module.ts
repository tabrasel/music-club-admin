import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { NavbarComponent } from './navbar/navbar.component';
import { RoundsViewComponent } from './rounds-view/rounds-view.component';
import { RoundsListComponent } from './rounds-list/rounds-list.component';
import { RoundInfoComponent } from './round-info/round-info.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    RoundsViewComponent,
    RoundsListComponent,
    RoundInfoComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
