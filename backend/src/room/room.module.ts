import { Module } from '@nestjs/common';
import { RoomGateway } from './room.gateway';
import { RoomService } from './room.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoomController } from './room.controller';
import { SessionModule } from 'src/session/session.module';
import { SessionService } from 'src/session/session.service';
import { SpotifyService } from 'src/spotify/spotify.service';

@Module({
  imports: [SessionModule],
  providers: [
    RoomGateway,
    RoomService,
    PrismaService,
    SessionService,
    SpotifyService,
  ],
  controllers: [RoomController],
})
export class RoomModule {}
