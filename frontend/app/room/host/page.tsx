"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import axios from "axios";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import {
  Music,
  LogOut,
  Trash2,
  Loader2,
  ListMusic,
  Clock,
  Search,
  Plus,
  UserX,
  Users,
  Settings,
  Share2,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function HostRoom() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<any>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [roomMembers, setRoomMembers] = useState<any[]>([]);
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);

  axios.defaults.headers.common[
    "Authorization"
  ] = `Bearer ${localStorage.getItem("jwt_token")}`;

  useEffect(() => {
    // Connect to socket
    socketRef.current = io("http://localhost:9000", {
      withCredentials: true,
      auth: {
        token: localStorage.getItem("jwt_token"),
      },
    });

    fetchRoomData();

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("Connected to room socket");
    });

    socket.on("queue_updated", (data) => {
      console.log("Queue updated", data);
      setQueue(data.queue || []);
    });

    socket.on("now_playing", (data) => {
      console.log("Now playing updated", data);
      setCurrentlyPlaying(data);
    });

    socket.on("user_joined", (data) => {
      console.log("User joined", data);
      fetchRoomMembers();
    });

    socket.on("user_left", (data) => {
      console.log("User left", data);
      fetchRoomMembers();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  async function fetchRoomData() {
    setIsLoading(true);
    try {
      const [currentTrack, roomData] = await Promise.all([
        axios.get("http://127.0.0.1:4000/room/current-song"),
        //   axios.get("http://127.0.0.1:4000/room/queue"),
        //   axios.get("http://127.0.0.1:4000/room/members"),
        axios.get("http://127.0.0.1:4000/room/current"),
      ]);

      setCurrentlyPlaying(currentTrack.data);
      //   setQueue(queueData.data.queue || []);
      //   setRoomMembers(membersData.data.members || []);
      setRoomInfo(roomData.data);
    } catch (error) {
      console.error("Failed to fetch room data", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteRoom() {
    setIsLoading(true);
    try {
      await axios.delete("http://127.0.0.1:4000/room/delete");
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to delete room", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function leaveRoom() {
    setIsLoading(true);
    try {
      await axios.post("http://127.0.0.1:4000/room/leave-room");
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to leave room", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function kickMember(memberId: string) {
    setIsLoading(true);
    try {
      await axios.post("http://127.0.0.1:4000/room/kick", {
        userId: memberId,
      });
      fetchRoomMembers();
    } catch (error) {
      console.error("Failed to kick member", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function removeSong(songId: string) {
    setIsLoading(true);
    try {
      await axios.post("http://127.0.0.1:4000/room/remove-song", {
        songId,
      });
      // Queue will be updated via socket
    } catch (error) {
      console.error("Failed to remove song", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function searchSongs() {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const response = await axios.post(
        "http://127.0.0.1:4000/spotify/search-song",
        {
          body: searchQuery,
        }
      );
      setSearchResults(response.data.tracks.items || []);
    } catch (error) {
      console.error("Failed to search songs", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function addToQueue(trackId: string) {
    setIsLoading(true);
    try {
      await axios.post("http://127.0.0.1:4000/room/add-to-queue", {
        trackId,
      });
      setSearchDialogOpen(false);
      setSearchQuery("");
      setSearchResults([]);
    } catch (error) {
      console.error("Failed to add song to queue", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchRoomMembers() {
    try {
      const response = await axios.get("http://127.0.0.1:4000/room/members");
      setRoomMembers(response.data.members || []);
    } catch (error) {
      console.error("Failed to fetch room members", error);
    }
  }

  return (
    <div className="pb-20">
      {/* Room Info Section */}
      <section className="mb-6">
        <Card className="bg-black/40 border border-purple-500/30 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <div className="flex justify-between">
              <div>
                <CardTitle className="text-xl text-white">
                  {roomInfo?.name || "Your Party"}
                </CardTitle>
                <CardDescription>
                  Room Code:{" "}
                  <span className="font-mono bg-black/60 px-2 py-0.5 rounded">
                    {roomInfo?.room.inviteCode || "------"}
                  </span>
                </CardDescription>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShareDialogOpen(true)}
                  className="border-purple-500/50 text-purple-300"
                >
                  <Share2 className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="border-red-500/50 text-red-300"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-blue-400" />
              <span className="text-gray-300 text-sm">
                {roomMembers.length}{" "}
                {roomMembers.length === 1 ? "member" : "members"}
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Now Playing Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Now Playing</h2>

        {isLoading && !currentlyPlaying ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
          </div>
        ) : currentlyPlaying ? (
          <Card className="bg-black/40 border border-purple-500/30 backdrop-blur-sm overflow-hidden">
            <div className="md:flex">
              {/* Album Art */}
              <div className="md:w-1/3 relative">
                <div className="aspect-square relative">
                  {currentlyPlaying.album?.images?.[0]?.url ? (
                    <Image
                      src={currentlyPlaying.album.images[0].url}
                      alt={currentlyPlaying.name || "Album cover"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                      <Music className="h-16 w-16 text-gray-600" />
                    </div>
                  )}
                </div>
              </div>

              {/* Song Details */}
              <div className="p-6 md:w-2/3 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    {currentlyPlaying.name}
                  </h3>
                  <p className="text-gray-400 mb-4">
                    {currentlyPlaying.artists
                      ?.map((a: any) => a.name)
                      .join(", ")}
                  </p>

                  <div className="flex items-center text-gray-400 mb-4">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>
                      {Math.floor(currentlyPlaying.duration_ms / 60000)}:
                      {String(
                        Math.floor(
                          (currentlyPlaying.duration_ms % 60000) / 1000
                        )
                      ).padStart(2, "0")}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    From album: {currentlyPlaying.album?.name}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="bg-black/40 border border-purple-500/30 backdrop-blur-sm p-8 text-center">
            <Music className="h-12 w-12 mx-auto text-gray-600 mb-3" />
            <p className="text-gray-400">No song currently playing</p>
          </Card>
        )}
      </section>

      {/* Queue Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Queue Management</h2>
          <Button
            onClick={() => setSearchDialogOpen(true)}
            variant="outline"
            className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Song
          </Button>
        </div>

        <Tabs defaultValue="queue" className="mb-6">
          <TabsList className="bg-black/60 mb-4">
            <TabsTrigger
              value="queue"
              className="data-[state=active]:bg-purple-800"
            >
              <ListMusic className="h-4 w-4 mr-2" />
              Song Queue
            </TabsTrigger>
            <TabsTrigger
              value="members"
              className="data-[state=active]:bg-purple-800"
            >
              <Users className="h-4 w-4 mr-2" />
              Members
            </TabsTrigger>
          </TabsList>

          <TabsContent value="queue" className="mt-0">
            {queue.length > 0 ? (
              <div className="space-y-2">
                {queue.map((song) => (
                  <Card
                    key={song.id}
                    className="bg-black/40 border border-gray-700/30 backdrop-blur-sm"
                  >
                    <div className="flex items-center p-3">
                      {song.album?.images?.[0]?.url ? (
                        <Image
                          src={song.album.images[0].url}
                          alt={song.name || "Album cover"}
                          width={48}
                          height={48}
                          className="object-cover rounded mr-3"
                        />
                      ) : (
                        <div className="w-12 h-12 flex items-center justify-center bg-gray-800 rounded mr-3">
                          <Music className="h-6 w-6 text-gray-600" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h4 className="text-white text-sm font-medium truncate">
                          {song.name}
                        </h4>
                        <p className="text-gray-400 text-xs truncate">
                          {song.artists?.map((a: any) => a.name).join(", ")}
                        </p>
                        <div className="flex items-center mt-1">
                          <div className="flex -space-x-1">
                            {(song.votes?.likes || [])
                              .slice(0, 3)
                              .map((vote: string, i: number) => (
                                <div
                                  key={`like-${i}`}
                                  className="w-5 h-5 rounded-full bg-green-500 border border-black flex items-center justify-center text-[10px] text-white"
                                >
                                  {vote.substring(0, 1).toUpperCase()}
                                </div>
                              ))}
                          </div>
                          {song.votes?.likes?.length > 0 && (
                            <span className="text-green-500 text-xs ml-2">
                              {song.votes.likes.length}{" "}
                              {song.votes.likes.length === 1 ? "like" : "likes"}
                            </span>
                          )}

                          <div className="flex -space-x-1 ml-4">
                            {(song.votes?.dislikes || [])
                              .slice(0, 3)
                              .map((vote: string, i: number) => (
                                <div
                                  key={`dislike-${i}`}
                                  className="w-5 h-5 rounded-full bg-red-500 border border-black flex items-center justify-center text-[10px] text-white"
                                >
                                  {vote.substring(0, 1).toUpperCase()}
                                </div>
                              ))}
                          </div>
                          {song.votes?.dislikes?.length > 0 && (
                            <span className="text-red-500 text-xs ml-2">
                              {song.votes.dislikes.length}{" "}
                              {song.votes.dislikes.length === 1
                                ? "dislike"
                                : "dislikes"}
                            </span>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-red-400 hover:bg-red-500/20"
                        onClick={() => removeSong(song.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-black/40 border border-gray-700/30 backdrop-blur-sm p-6 text-center">
                <ListMusic className="h-10 w-10 mx-auto text-gray-600 mb-3" />
                <p className="text-gray-400">No songs in the queue</p>
                <p className="text-gray-500 text-sm mt-2">
                  Add a song to get the party started!
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="members" className="mt-0">
            {roomMembers.length > 0 ? (
              <div className="space-y-2">
                {roomMembers.map((member) => (
                  <Card
                    key={member.id}
                    className="bg-black/40 border border-gray-700/30 backdrop-blur-sm"
                  >
                    <div className="flex items-center p-4">
                      <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center mr-3">
                        <span className="text-white font-medium">
                          {member.name?.substring(0, 1).toUpperCase() || "U"}
                        </span>
                      </div>

                      <div className="flex-1">
                        <h4 className="text-white">
                          {member.name || "Unknown User"}
                        </h4>
                        <p className="text-gray-400 text-sm">
                          {member.isHost ? "Host" : "Member"}
                        </p>
                      </div>

                      {!member.isHost && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-red-400 hover:bg-red-500/20"
                          onClick={() => kickMember(member.id)}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-black/40 border border-gray-700/30 backdrop-blur-sm p-6 text-center">
                <Users className="h-10 w-10 mx-auto text-gray-600 mb-3" />
                <p className="text-gray-400">No other members in the room</p>
                <p className="text-gray-500 text-sm mt-2">
                  Share the room code to invite others!
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </section>

      {/* Fixed bottom button for leaving */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-sm border-t border-purple-500/20">
        <Button
          onClick={leaveRoom}
          variant="destructive"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Leaving...
            </>
          ) : (
            <>
              <LogOut className="mr-2 h-4 w-4" />
              Leave Room
            </>
          )}
        </Button>
      </div>

      {/* Search Dialog */}
      <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
        <DialogContent className="bg-gray-900 border border-purple-500/30 text-white max-w-lg w-[90%]">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">
              Add Song to Queue
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Search for a song to add to the party queue
            </DialogDescription>
          </DialogHeader>

          <div className="flex mb-4">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-gray-800 border-gray-700 text-white mr-2"
              placeholder="Search songs..."
              onKeyDown={(e) => {
                if (e.key === "Enter") searchSongs();
              }}
            />
            <Button
              onClick={searchSongs}
              disabled={isLoading || !searchQuery.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="max-h-[300px] overflow-y-auto pr-2 -mr-2">
            {searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center p-2 hover:bg-gray-800/50 rounded cursor-pointer"
                    onClick={() => addToQueue(track.id)}
                  >
                    {track.album?.images?.[0]?.url ? (
                      <Image
                        src={track.album.images[0].url}
                        alt={track.name || "Album cover"}
                        width={48}
                        height={48}
                        className="object-cover rounded mr-3"
                      />
                    ) : (
                      <div className="w-12 h-12 flex items-center justify-center bg-gray-800 rounded mr-3">
                        <Music className="h-6 w-6 text-gray-600" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h4 className="text-white text-sm font-medium truncate">
                        {track.name}
                      </h4>
                      <p className="text-gray-400 text-xs truncate">
                        {track.artists?.map((a: any) => a.name).join(", ")}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-purple-400"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : searchQuery && !isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No results found</p>
              </div>
            ) : !searchQuery ? (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400">
                  Search for songs to add to the queue
                </p>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="bg-gray-900 border border-purple-500/30 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">
              Invite Friends
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Share this code with friends to join your party
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 flex flex-col items-center">
            <div className="bg-black p-6 rounded-lg border border-purple-500/30 mb-4">
              <p className="text-3xl font-mono text-white tracking-wider">
                {roomInfo?.code || "------"}
              </p>
            </div>

            <Button
              onClick={() => {
                if (roomInfo?.code) {
                  navigator.clipboard.writeText(roomInfo.code);
                }
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Copy Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Room Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-900 border border-red-500/30 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Delete Room?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will end the party for all participants. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-white hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={deleteRoom}
            >
              Delete Room
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
