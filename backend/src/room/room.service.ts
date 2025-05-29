import { Injectable } from '@nestjs/common';
import { customAlphabet, nanoid } from 'nanoid';
import { PrismaService } from 'src/prisma/prisma.service';
import { Room } from 'src/shared/interfaces/room.interface';

@Injectable()
export class RoomService {
  constructor(private prisma: PrismaService) {}
  private rooms: Room[] = [];

  generateInviteCode() {
    const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);
    return nanoid();
  }

  async addRoom(roomId: string, userId: string): Promise<string> {
    try {
      const user = await this.prisma.member.findFirst({
        where: {
          userId: userId,
        },
      });

      await this.prisma.room.create({
        data: {
          roomName: roomId,
          inviteCode: this.generateInviteCode(),
          host: {
            connect: { id: user?.id }, // Connect using the user's ID
          },
          // Also add the host as a member of the room
          members: {
            connect: { id: user?.id },
          },
        },
      });

      return 'Successfully created room!';
    } catch (error) {
      return `Error: ${error}`;
    }
  }

  async removeRoom(roomId: string): Promise<string> {
    try {
      await this.prisma.room.delete({
        where: {
          roomName: roomId,
        },
      });

      return `Room ${roomId} deleted successfully!`;
    } catch {
      return `Room ${roomId} does not exists!`;
    }
  }

  async joinRoom(roomId: string, userId: string): Promise<boolean> {
    try {
      const updatedMember = await this.prisma.member.upsert({
        where: { userId: userId },
        create: {
          userId: userId,
          room: { connect: { roomName: roomId } },
        },
        update: {
          room: { connect: { roomName: roomId } },
        },
        include: { room: true },
      });
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  async checkIfRoomExists(roomId: string): Promise<boolean> {
    if (this.rooms.length === 0) {
      return false;
    }

    let room = await this.rooms.filter((value) => {
      return value.roomId == roomId;
    });

    console.log(room);

    if (room.length > 0) {
      return true;
    } else {
      return false;
    }
  }

  async checkIfRoomHasMember(
    roomId: string,
    client: string,
  ): Promise<Room | null> {
    let room = this.rooms.find((value) => {
      return value.roomId === roomId;
    });

    console.log(room);

    if (
      room &&
      !room?.members.find((value) => {
        value === client;
      })
    ) {
      return room;
    } else {
      return null;
    }
  }

  async getAllRooms(): Promise<Room[]> {
    return this.rooms;
  }
}
