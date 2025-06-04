import { OnModuleInit } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { RoomService } from './room.service';
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
      // console.log(socket);

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

  // @SubscribeMessage('send_song_suggestion')
  // async handleSendSongSuggestion(client: any, payload: any) {
  //   const parsedPayload = JSON.parse(payload);
  //   console.log(parsedPayload);
  //   let response = await this.roomService.checkIfRoomHasMember(
  //     parsedPayload.roomName,
  //     client.handshake.auth.token,
  //   );

  //   if (response) {
  //     this.server.to(response.roomId).emit('send_song_suggestion', {
  //       msg: 'Send Song Suggestion',
  //       response: parsedPayload.message,
  //     });
  //   } else {
  //     this.server.emit('send_song_suggestion', {
  //       msg: 'Join Room Status',
  //       response: response,
  //     });
  //   }
  // }
}
