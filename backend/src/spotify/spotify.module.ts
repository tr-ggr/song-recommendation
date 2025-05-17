import { Module } from '@nestjs/common';
import { SpotifyController } from './spotify.controller';
import { SpotifyService } from './spotify.service';
import { SessionModule } from 'src/session/session.module';
import { SessionService } from 'src/session/session.service';

@Module({
  imports: [SessionModule],
  controllers: [SpotifyController],
  providers: [SpotifyService, SessionService],
})
export class SpotifyModule {}
