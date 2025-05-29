import { OnModuleInit } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { RoomService } from './room.service';
import { Room } from 'src/shared/interfaces/room.interface';
import { SpotifyService } from 'src/spotify/spotify.service';
import { PrismaService } from 'src/prisma/prisma.service';

@WebSocketGateway(9000, {
  cors: {
    origin: ['http://127.0.0.1:3000', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Authorization'],
  },
})
export class RoomGateway implements OnModuleInit {
  constructor(
    private readonly roomService: RoomService,
    private prisma: PrismaService,
  ) {}
  @WebSocketServer()
  server: Server;

  onModuleInit() {
    this.server.on('connection', async (socket) => {
      console.log(`Client connected: ${socket.id}`);
      console.log(socket);

      const member = await this.prisma.member.upsert({
        where: {
          userId: socket.handshake.auth.token,
        },
        create: {
          userId: socket.handshake.auth.token,
        },
        update: {},
      });

      console.log(member);

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): string {
    this.server.emit('message', {
      msg: 'New Message',
      from: client.handshake.auth.token,
      body: payload,
    });
    return 'Hello world!';
  }

  @SubscribeMessage('create_room')
  async handleCreateRoom(client: any, payload: any) {
    const parsedPayload = JSON.parse(payload);
    console.log(parsedPayload);

    await this.server
      .in(client.handshake.auth.token)
      .socketsJoin(parsedPayload.roomName);

    let response = await this.roomService.addRoom(
      parsedPayload.roomName,
      client.handshake.auth.token,
    );

    await this.server.emit('create_room', {
      msg: 'Create Room Status',
      response: response,
      rooms: await this.roomService.getAllRooms(),
    });
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(client: any, payload: any) {
    const parsedPayload = JSON.parse(payload);
    console.log(parsedPayload);

    let res = await this.roomService.joinRoom(
      parsedPayload.roomName,
      client.handshake.auth.token,
    );

    if (res) {
      await this.server
        .in(client.handshake.auth.token)
        .socketsJoin(parsedPayload.roomName);
      await this.server.to(parsedPayload.roomName).emit('join_room', {
        msg: 'Join Room Status',
        response: res,
      });
    } else {
      await this.server.emit('join_room', {
        msg: 'Join Room Status',
        response: 'Room does not exists!',
      });
    }
  }

  @SubscribeMessage('send_song_suggestion')
  async handleSendSongSuggestion(client: any, payload: any) {
    const parsedPayload = JSON.parse(payload);
    console.log(parsedPayload);
    let response = await this.roomService.checkIfRoomHasMember(
      parsedPayload.roomName,
      client.handshake.auth.token,
    );

    if (response) {
      this.server.to(response.roomId).emit('send_song_suggestion', {
        msg: 'Send Song Suggestion',
        response: parsedPayload.message,
      });
    } else {
      this.server.emit('send_song_suggestion', {
        msg: 'Join Room Status',
        response: response,
      });
    }
  }
}
