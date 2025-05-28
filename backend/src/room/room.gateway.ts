import { OnModuleInit } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { RoomService } from './room.service';
import { Room } from 'src/shared/interfaces/room.interface';

@WebSocketGateway(9000)
export class RoomGateway implements OnModuleInit {
  constructor(private readonly roomService : RoomService){}
  @WebSocketServer()
  server : Server

  onModuleInit() {
    this.server.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);
      
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    })
  }


  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): string {
    this.server.emit('message', {
      msg: 'New Message',
      from: client.id,
      body: payload
    })
    return 'Hello world!';
  }

  @SubscribeMessage('create_room')
  async handleCreateRoom(client: any, payload: any) {
    const parsedPayload = JSON.parse(payload)
    console.log(parsedPayload)

    await this.server.in(client.id).socketsJoin(parsedPayload.roomName)
    let response = await this.roomService.addRoom(parsedPayload.roomName, client.id)

    await this.server.emit('create_room', {
      msg: 'Create Room Status',
      response : response,
      rooms: await this.roomService.getAllRooms()
    })
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(client: any, payload: any) {
    const parsedPayload = JSON.parse(payload)
    console.log(parsedPayload)

    let res = await this.roomService.joinRoom(parsedPayload.roomName, client.id)

    if(typeof res == 'object'){
      await this.server.in(client.id).socketsJoin(parsedPayload.roomName)
      await this.server.to((res as Room).roomId).emit('join_room', {
        msg: 'Join Room Status',
        response : res,
      })
    } else {
        await this.server.emit('join_room', {
        msg: 'Join Room Status',
        response : 'Room does not exists!',
        rooms : await this.roomService.getAllRooms()
      })
    }
  }

  @SubscribeMessage('send_song_suggestion')
  async handleSendSongSuggestion(client: any, payload: any) {
    const parsedPayload = JSON.parse(payload)
    console.log(parsedPayload)
    let response = await this.roomService.checkIfRoomHasMember(parsedPayload.roomName, client.id)

    if(response){
      this.server.to(response.roomId).emit('send_song_suggestion', {
        msg: 'Send Song Suggestion',
        response : parsedPayload.message
      })
    } else {
      this.server.emit('send_song_suggestion', {
        msg: 'Join Room Status',
        response : response
      })
    }

  }


  
}
