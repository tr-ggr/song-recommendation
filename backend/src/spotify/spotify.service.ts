import { Injectable, Req } from '@nestjs/common';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { PrismaService } from 'src/prisma/prisma.service';
import { SessionService } from 'src/session/session.service';

@Injectable()
export class SpotifyService {
  constructor(
    private readonly sessionService: SessionService,
    private prisma: PrismaService,
  ) {}

  async acceptUserToken(request) {
    console.log(request.body);

    this.sessionService.addSession(request.body);

    const sdk = SpotifyApi.withAccessToken(
      process.env.SPOTIFY_CLIENT!,
      request.body,
    );

    if (!sdk) {
      //   console.log('invalid');
      return { message: 'Invalid!' };
    } else {
      //   console.log('valid');
      const member = await this.prisma.member.upsert({
        where: {
          userId: request.body.access_token,
        },
        create: {
          userId: request.body.access_token,
        },
        update: {},
      });

      console.log(member);
      return {
        message: 'Successfully logged in!',
        access_token: request.body.access_token,
      };
    }
  }

  async logOutCurrentSession(session) {
    const sdk = SpotifyApi.withAccessToken(
      process.env.SPOTIFY_CLIENT!,
      session,
    );

    const res = await sdk.logOut();
    this.sessionService.removeSession(session);

    return {
      message: 'Successfully logged out!',
    };
  }

  async getCurrentPlayback(session) {
    const sdk = SpotifyApi.withAccessToken(
      process.env.SPOTIFY_CLIENT!,
      session,
    );
    // console.log(request);
    let currentlyPlaying = await sdk.player.getCurrentlyPlayingTrack();
    console.log(currentlyPlaying);
    return currentlyPlaying;
  }

  async getSongQueue(session) {
    const sdk: SpotifyApi = SpotifyApi.withAccessToken(
      process.env.SPOTIFY_CLIENT!,
      session,
    );
    // console.log(request);
    let songQueue = await sdk.player.getUsersQueue();
    console.log(songQueue);
    return songQueue;
  }

  async addSongToRoomQueue(session) {
    const sdk: SpotifyApi = SpotifyApi.withAccessToken(
      process.env.SPOTIFY_CLIENT!,
      session.session,
    );
  }

  async suggestSong() {}

  async searchSong(session) {
    const sdk: SpotifyApi = SpotifyApi.withAccessToken(
      process.env.SPOTIFY_CLIENT!,
      session.session,
    );

    console.log(session.body.body);

    const items = await sdk.search(session.body.body, ['track']);

    return items;
  }
}
