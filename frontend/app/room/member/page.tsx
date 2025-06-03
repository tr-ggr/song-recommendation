"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import axios from "axios";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import {
  Music,
  LogOut,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  ListMusic,
  Clock,
  Search,
  Plus,
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

export default function MemberRoom() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<any>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [upcomingSongs, setUpcomingSongs] = useState<any[]>([]);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [swipeStart, setSwipeStart] = useState<number | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to socket
    socketRef.current = io("http://localhost:9000", {
      withCredentials: true,
      auth: {
        token: localStorage.getItem("jwt_token"),
      },
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("Connected to room socket");
    });

    socket.on("queue_updated", (data) => {
      console.log("Queue updated", data);
      setQueue(data.queue || []);
      setUpcomingSongs(data.upcoming || []);
    });

    socket.on("now_playing", (data) => {
      console.log("Now playing updated", data);
      setCurrentlyPlaying(data);
    });

    fetchRoomData();

    return () => {
      socket.disconnect();
    };
  }, []);

  async function fetchRoomData() {
    setIsLoading(true);
    try {
      const [currentTrack, queueData] = await Promise.all([
        axios.get("http://127.0.0.1:4000/room/now-playing"),
        axios.get("http://127.0.0.1:4000/room/queue"),
      ]);

      setCurrentlyPlaying(currentTrack.data);
      setQueue(queueData.data.queue || []);
      setUpcomingSongs(queueData.data.upcoming || []);
    } catch (error) {
      console.error("Failed to fetch room data", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function leaveRoom() {
    setIsLoading(true);
    try {
      await axios.post("http://127.0.0.1:4000/room/leave");
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to leave room", error);
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

  async function voteSong(songId: string, vote: "like" | "dislike") {
    try {
      await axios.post("http://127.0.0.1:4000/room/vote", {
        songId,
        vote,
      });
      // The queue will be updated via socket
    } catch (error) {
      console.error("Failed to vote on song", error);
    }
  }

  // Touch handlers for swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    setSwipeStart(e.touches[0].clientX);
    setSwipeDirection(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (swipeStart === null || !cardRef.current) return;

    const currentX = e.touches[0].clientX;
    const diff = currentX - swipeStart;
    const threshold = 50;

    // Apply transform to the card
    cardRef.current.style.transform = `translateX(${diff}px) rotate(${
      diff * 0.1
    }deg)`;

    if (diff > threshold) {
      setSwipeDirection("like");
    } else if (diff < -threshold) {
      setSwipeDirection("dislike");
    } else {
      setSwipeDirection(null);
    }
  };

  const handleTouchEnd = (songId: string) => {
    if (swipeDirection === "like") {
      voteSong(songId, "like");
    } else if (swipeDirection === "dislike") {
      voteSong(songId, "dislike");
    }

    // Reset the card position
    if (cardRef.current) {
      cardRef.current.style.transform = "translateX(0) rotate(0)";
    }
    setSwipeStart(null);
    setSwipeDirection(null);
  };

  return (
    <div className="pb-20">
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
          <h2 className="text-2xl font-bold text-white">Song Queue</h2>
          <Button
            onClick={() => setSearchDialogOpen(true)}
            variant="outline"
            className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Song
          </Button>
        </div>

        {/* Song Swipe Cards */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-300 mb-3">
            Vote on upcoming songs
          </h3>

          {queue.length > 0 ? (
            <div className="space-y-4">
              {queue.map((song, index) => (
                <div
                  key={song.id}
                  ref={index === 0 ? cardRef : undefined}
                  className={`relative transition-transform duration-200 touch-manipulation`}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={() => handleTouchEnd(song.id)}
                >
                  <Card className="bg-black/40 border border-purple-500/30 backdrop-blur-sm overflow-hidden">
                    <div className="md:flex">
                      <div className="md:w-1/4 relative">
                        <div className="aspect-square relative">
                          {song.album?.images?.[0]?.url ? (
                            <Image
                              src={song.album.images[0].url}
                              alt={song.name || "Album cover"}
                              width={120}
                              height={120}
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-800">
                              <Music className="h-10 w-10 text-gray-600" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-4 md:w-2/4 flex flex-col justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-white truncate">
                            {song.name}
                          </h3>
                          <p className="text-gray-400 truncate">
                            {song.artists?.map((a: any) => a.name).join(", ")}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 md:w-1/4 flex items-center justify-end">
                        <div className="flex space-x-3">
                          <Button
                            variant="outline"
                            size="icon"
                            className={`rounded-full ${
                              swipeDirection === "dislike"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-transparent text-gray-400 hover:text-red-400 hover:bg-red-500/20 border-gray-700"
                            }`}
                            onClick={() => voteSong(song.id, "dislike")}
                          >
                            <ThumbsDown className="h-5 w-5" />
                          </Button>

                          <Button
                            variant="outline"
                            size="icon"
                            className={`rounded-full ${
                              swipeDirection === "like"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-transparent text-gray-400 hover:text-green-400 hover:bg-green-500/20 border-gray-700"
                            }`}
                            onClick={() => voteSong(song.id, "like")}
                          >
                            <ThumbsUp className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Visual cues for swiping */}
                    {swipeDirection === "like" && (
                      <div className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-green-500/80 text-white px-4 py-2 rounded-full">
                        <ThumbsUp className="h-6 w-6" />
                      </div>
                    )}

                    {swipeDirection === "dislike" && (
                      <div className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-red-500/80 text-white px-4 py-2 rounded-full">
                        <ThumbsDown className="h-6 w-6" />
                      </div>
                    )}
                  </Card>
                </div>
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
        </div>

        {/* Up Next */}
        <div>
          <h3 className="text-lg font-medium text-gray-300 mb-3">Up Next</h3>
          {upcomingSongs.length > 0 ? (
            <div className="space-y-2">
              {upcomingSongs.map((song) => (
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
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-black/40 border border-gray-700/30 backdrop-blur-sm p-4 text-center">
              <p className="text-gray-400 text-sm">No upcoming songs</p>
            </Card>
          )}
        </div>
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
    </div>
  );
}
