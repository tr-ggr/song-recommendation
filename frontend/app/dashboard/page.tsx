"use client";
import { PartialSearchResult } from "@spotify/web-api-ts-sdk";
import axios from "axios";
import { FormEvent, useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import {
  Music,
  Users,
  Search,
  LogOut,
  Plus,
  DoorOpen,
  Loader2,
  Play,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Dashboard() {
  const [tracks, setTracks] = useState<PartialSearchResult["tracks"]>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<any>(null);
  const [queue, setQueue] = useState<any>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  useEffect(() => {
    const socket = io("http://localhost:9000", {
      withCredentials: true,
      reconnectionDelayMax: 10000,
      auth: {
        token: localStorage.getItem("jwt_token"),
      },
    });

    socket.on("connect", () => {
      console.log("Successfully connected!");
    });

    // Check current playback on initial load
    checkCurrentlyPlaying();
  }, []);

  const router = useRouter();

  async function checkCurrentlyPlaying() {
    setIsLoading(true);
    axios
      .get("http://127.0.0.1:4000/spotify/currently-playing")
      .then((response) => {
        setCurrentlyPlaying(response.data);
        console.log(response.data);
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  async function handleJoinRoom() {
    setIsLoading(true);

    axios
      .post("http://127.0.0.1:4000/room/join", {
        inviteCode: inviteCode,
      })
      .then((response) => {
        console.log(response.data);
        setJoinDialogOpen(false);
        setInviteCode("");
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  async function handleCreateRoom() {
    setIsLoading(true);

    axios
      .post("http://127.0.0.1:4000/room/create", {
        roomName: roomName,
      })
      .then((response) => {
        console.log(response.data);
        setCreateDialogOpen(false);
        setRoomName("");
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  async function leaveRoom() {
    setIsLoading(true);

    axios
      .post("http://127.0.0.1:4000/room/leave-room", {})
      .then((response) => {
        console.log(response.data);
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  async function logOut() {
    setIsLoading(true);
    axios
      .post("http://127.0.0.1:4000/spotify/logout")
      .then((response) => {
        console.log(response.data);
        router.replace("/");
      })
      .catch((error) => {
        console.log(error);
      });
  }

  async function checkSongQueue() {
    setIsLoading(true);
    axios
      .get("http://127.0.0.1:4000/spotify/song-queue")
      .then((response) => {
        setQueue(response.data);
        console.log(response.data);
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  async function searchSong(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formdata = new FormData(event.currentTarget);
    const searchQuery = formdata.get("search-item");

    axios
      .post("http://127.0.0.1:4000/spotify/search-song", {
        body: searchQuery,
      })
      .then((response) => {
        console.log(response.data.tracks);
        setTracks(response.data.tracks);
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black p-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header with logout */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <Music className="h-8 w-8 text-green-500 mr-2" />
            <h1 className="text-3xl font-bold text-white">Song Party!</h1>
          </div>
          <Button
            onClick={logOut}
            variant="ghost"
            className="text-gray-300 hover:text-white hover:bg-red-500/20"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </Button>
        </div>

        {/* Main content - Centered big buttons */}
        <div className="flex flex-col items-center justify-center mt-16 space-y-8">
          <h2 className="text-3xl font-bold text-white text-center mb-6">
            What would you like to do?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
            <Button
              className="h-48 text-xl font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all"
              onClick={() => setJoinDialogOpen(true)}
            >
              <DoorOpen className="h-10 w-10 mr-3" />
              Join Room
            </Button>

            <Button
              className="h-48 text-xl font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg hover:shadow-purple-500/20 transition-all"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="h-10 w-10 mr-3" />
              Create Room
            </Button>
          </div>

          <p className="text-gray-400 text-center mt-8">
            Join an existing party or create your own to start the music!
          </p>
        </div>
      </div>

      {/* Create Room Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-gray-900 border border-purple-500/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">
              Create a Room
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter a name for your new listening party.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="room-name" className="text-white">
              Room Name
            </Label>
            <Input
              id="room-name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="mt-2 bg-gray-800 border-gray-700 text-white"
              placeholder="My Awesome Party"
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleCreateRoom}
              disabled={isLoading || !roomName.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Room"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Join Room Dialog */}
      <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <DialogContent className="bg-gray-900 border border-blue-500/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">
              Join a Room
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter the invite code to join an existing listening party.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="invite-code" className="text-white">
              Invite Code
            </Label>
            <Input
              id="invite-code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="mt-2 bg-gray-800 border-gray-700 text-white"
              placeholder="Enter invite code"
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleJoinRoom}
              disabled={isLoading || !inviteCode.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                "Join Room"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
