import { Injectable } from '@nestjs/common';
import { Member, Room } from 'generated/prisma';
import { customAlphabet, nanoid } from 'nanoid';
import { stringify } from 'querystring';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RoomService {
  constructor(private prisma: PrismaService) {}

  generateInviteCode() {
    const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);
    return nanoid();
  }

  async addRoom(roomName: string, userId: string): Promise<Room | string> {
    try {
      const user = await this.prisma.member.findFirst({
        where: {
          userId: userId,
        },
      });

      console.log(roomName);

      let inviteCode = this.generateInviteCode();

      let createdRoom = await this.prisma.room.create({
        data: {
          roomName: roomName,
          inviteCode: inviteCode,
          host: {
            connect: { id: user?.id },
          },
          members: {
            connect: { id: user?.id },
          },
        },
      });

      console.log(createdRoom);

      return createdRoom;
    } catch (error) {
      return error;
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

  async leaveRoom(userId: string): Promise<string> {
    try {
      await this.prisma.member.update({
        where: {
          userId: userId,
        },
        data: {
          roomId: null,
        },
      });

      return 'Successful!';
    } catch (err) {
      return `Error: ${err}`;
    }
  }

  async joinRoom(inviteCode: string, userId: string): Promise<Room | string> {
    console.log(inviteCode, userId);
    try {
      const updatedMember = await this.prisma.member.upsert({
        where: { userId: userId },
        create: {
          userId: userId,
          room: { connect: { inviteCode: inviteCode } },
        },
        update: {
          room: { connect: { inviteCode: inviteCode } },
        },
        include: { room: true },
      });

      const room = await this.prisma.room.findUnique({
        where: { inviteCode: inviteCode },
      });
      return room!;
    } catch (err) {
      return err;
    }
  }

  async getRoom(userId: string) {
    console.log(userId);
    try {
      let user = await this.prisma.member.findUnique({
        where: { userId: userId },
      });

      return user?.roomId;
    } catch (err) {
      return err;
    }
  }

  async getRoomMembers(roomName: string) {
    try {
      let room = this.prisma.room.findUnique({
        where: {
          roomName: roomName,
        },
      });

      return room.members;
    } catch (err) {
      return err;
    }
  }
}
