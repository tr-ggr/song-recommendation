import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SpotifyModule } from './spotify/spotify.module';
import { ConfigModule } from '@nestjs/config';
import { SessionModule } from './session/session.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [SpotifyModule, ConfigModule.forRoot(), SessionModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
