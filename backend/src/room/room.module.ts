import { Module } from '@nestjs/common';
import { RoomGateway } from './room.gateway';
import { RoomService } from './room.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [RoomGateway, RoomService, PrismaService],
})
export class RoomModule {}
