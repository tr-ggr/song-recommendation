import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { RoomService } from './room.service';
import { SpotifyAuthGuard } from 'src/auth/spotify-auth.guard';

@Controller('room')
export class RoomController {
  constructor(private roomService: RoomService) {}

  @UseGuards(SpotifyAuthGuard)
  @Post('/join')
  JoinRoom(@Req() request) {
    console.log(request.body);
    return this.roomService.joinRoom(
      request.body.inviteCode,
      request.session.access_token,
    );
  }

  @UseGuards(SpotifyAuthGuard)
  @Post('/create')
  CreateRoom(@Req() request) {
    console.log(request.body);
    return this.roomService.addRoom(
      request.body.roomName,
      request.session.access_token,
    );
  }

  @UseGuards(SpotifyAuthGuard)
  @Get('/current')
  GetCurrentRoom(@Req() request) {
    console.log(request.session.access_token);
    return this.roomService.getRoom(request.session.access_token);
  }

  @UseGuards(SpotifyAuthGuard)
  @Post('/leave-room')
  LeaveRoom(@Req() request) {
    console.log(request.session.access_token);
    return this.roomService.leaveRoom(request.session.access_token);
  }

  @UseGuards(SpotifyAuthGuard)
  @Get('/member')
  GetRoomMembers(@Req() request) {
    console.log(request.session.access_token);
    return this.roomService.leaveRoom(request.session.access_token);
  }
}
