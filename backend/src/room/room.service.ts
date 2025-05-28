import { Injectable } from '@nestjs/common';
import { Room } from 'src/shared/interfaces/room.interface';

@Injectable()
export class RoomService {
    private rooms : Room[] = []

    async addRoom(roomId : string, userId: string) : Promise<string> {
        if(await this.checkIfRoomExists(roomId)){
            return `Room ${roomId} already exists!`
        } else {
            // console.log(this.rooms)
            this.rooms.push({roomId : roomId, host : userId, members : [userId]})
            return `Room ${roomId} added successfully!`
        }
    }

    async removeRoom(roomId : string) : Promise<string> {
        if(await !this.checkIfRoomExists(roomId)){
            return `Room ${roomId} does not exists!`
        } else {
            this.rooms =  await this.rooms.filter((room) => {
             return room.roomId == roomId
            })
            return `Room ${roomId} deleted successfully!`
        }
    }

    async joinRoom(roomId : string, userId : string) : Promise<string|Room> {
        if(await !this.checkIfRoomExists(roomId)){
            return `Room ${roomId} does not exists!`
        } else {
            let room = this.rooms.find((value) => { return value.roomId === roomId })

            if(room?.members.find((value) => {return value == userId})){
                return `Room ${roomId} already has ${userId}`
            }
            
            room?.members.push(userId)
            return room!
        }
    }

    async checkIfRoomExists(roomId : string) : Promise<boolean> {
        if(this.rooms.length === 0){
            return false
        }

        let room = await this.rooms.filter((value) => {
            return value.roomId == roomId
        })

        console.log(room)

        if(room.length > 0){
            return true
        } else {
            return false
        }
    }

    async checkIfRoomHasMember(roomId : string, client : string) : Promise<Room|null> {
        let room = this.rooms.find((value) =>{ return value.roomId === roomId })

        console.log(room)

        if(room && !room?.members.find((value) => { value === client })){
            return room
        } else {
            return null
        }

 
    }

    async getAllRooms() : Promise<Room[]>{
        return this.rooms;
    }

}

