import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { SpotifyService } from './spotify.service';
import { request } from 'http';
import { SpotifyAuthGuard } from 'src/auth/spotify-auth.guard';

@Controller('spotify')
export class SpotifyController {
  constructor(private readonly spotifyService: SpotifyService) {}

  @Post('/login-with-accesstoken')
  SpotifyLogin(@Req() request) {
    // console.log(request);
    return this.spotifyService.acceptUserToken(request);
  }

  @UseGuards(SpotifyAuthGuard)
  @Get('/currently-playing')
  GetCurrentlyPlaying(@Req() request) {
    return this.spotifyService.getCurrentPlayback(request.session);
  }

  @UseGuards(SpotifyAuthGuard)
  @Get('/song-queue')
  GetSongQueue(@Req() request) {
    return this.spotifyService.getSongQueue(request.session);
  }

  @UseGuards(SpotifyAuthGuard)
  @Post('/search-song')
  SearchSong(@Req() request) {
    return this.spotifyService.searchSong(request);
  }

  @UseGuards(SpotifyAuthGuard)
  @Post('/logout')
  Logout(@Req() request) {
    return this.spotifyService.logOutCurrentSession(request.session);
  }
}
