"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { io, Socket } from "socket.io-client";

type SuggestedSong = {
  id: string;
  title: string;
  artist: string;
  albumArt?: string;
  suggestedBy: string;
  suggestedById: string;
};

export default function HostPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [roomInfo, setRoomInfo] = useState<any>({});
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [suggestedSongs, setSuggestedSongs] = useState<SuggestedSong[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const router = useRouter();

  async function fetchAllData(roomId: string) {
    const [roomData, currentTrackData] = await Promise.all([
      axios.get("http://127.0.0.1:4000/room/current"),
      axios.get("http://127.0.0.1:4000/spotify/currently-playing"),
    ]);

    setMembers(roomData.data.room.members);
    setRoomInfo(roomData.data);
    setCurrentTrack(currentTrackData.data);
    setTimeRemaining(
      currentTrackData.data.item.duration_ms - currentTrackData.data.progress_ms
    );

    // Broadcast current track if socket is connected, using the roomId parameter
    if (socketRef.current && socketRef.current.connected) {
      console.log("Broadcasting track after data fetch");
      broadcastCurrentTrack(currentTrackData.data, roomId);
    }

    return (
      currentTrackData.data.item.duration_ms - currentTrackData.data.progress_ms
    );
  }

  // Setup Socket.io connection
  const setupSocketConnection = (roomId: string) => {
    if (!roomId) return;

    // Create Socket.io connection
    const socket = io("http://127.0.0.1:9000", {
      auth: {
        token: localStorage.getItem("jwt_token"),
      },
    });
    socketRef.current = socket;

    // Connection events
    socket.on("connect", () => {
      console.log("Connected to Socket.io server as host");
      setIsConnected(true);

      // Join the room as host
      socket.emit("create_room", JSON.stringify({ roomName: roomId }));

      // Broadcast current track if available
      if (currentTrack) {
        broadcastCurrentTrack(currentTrack);
      }
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from Socket.io server");
      setIsConnected(false);
    });

    // Handle song suggestions
    socket.on("send_song_suggestion", (data) => {
      console.log("Received song suggestion:", data);
      const suggestion = data.response;

      // Add to suggestedSongs state
      setSuggestedSongs((prev) => [
        ...prev,
        {
          id: suggestion.songId,
          title: suggestion.song.title,
          artist: suggestion.song.artist,
          albumArt: suggestion.song.albumArt,
          suggestedBy: "Member", // This should ideally come from the backend
          suggestedById: "unknown", // This should ideally come from the backend
        },
      ]);
    });

    // Handle member updates - modified to broadcast current track
    socket.on("join_room", (data) => {
      console.log("Member joined:", data);
      if (data.response && data.response.members) {
        setMembers(data.response.members);

        // Broadcast current track to the newly joined member
        if (currentTrack) {
          console.log("Broadcasting track to newly joined member");
          setTimeout(() => {
            broadcastCurrentTrack(currentTrack, roomId);
          }, 500); // Small delay to ensure member is ready to receive
        }
      }
    });

    // Add listener for leave_room events
    socket.on("leave_room", (data) => {
      console.log("Member left:", data);
      if (data.response && data.response.members) {
        setMembers(data.response.members);
      }
    });

    // Add to setupSocketConnection
    socket.on("request_current_track", (data) => {
      console.log("Received request for current track:", data);
      try {
        const payload = typeof data === "string" ? JSON.parse(data) : data;
        const requestRoomName = payload.roomName;

        if (currentTrack && requestRoomName === roomId) {
          console.log("Broadcasting current track in response to request");
          broadcastCurrentTrack(currentTrack, roomId);
        }
      } catch (error) {
        console.error("Error processing track request:", error);
      }
    });
  };

  // Broadcast currently playing track to all members
  const broadcastCurrentTrack = (track: any, roomId?: string) => {
    console.log("Broadcasting track to all members...");

    if (!track) {
      console.log("No track data to broadcast");
      return;
    }

    if (!socketRef.current) {
      console.log("Socket not initialized, can't broadcast");
      return;
    }

    if (!socketRef.current.connected) {
      console.log("Socket not connected, can't broadcast");
      return;
    }

    // Use either the provided roomId parameter or try to get it from state
    const effectiveRoomId = roomId || roomInfo?.room?.id;

    if (!effectiveRoomId) {
      console.log("Room info:", roomInfo);
      console.log("No room ID available, can't broadcast");
      return;
    }

    console.log(
      `Emitting 'message' event with currently_playing type for room: ${effectiveRoomId}`
    );
    socketRef.current.emit(
      "message",
      JSON.stringify({
        type: "currently_playing",
        roomName: effectiveRoomId,
        track: track,
      })
    );

    // After sending, check if the socket is still connected
    console.log(
      "Message sent, socket status:",
      socketRef.current.connected ? "connected" : "disconnected"
    );
  };

  async function getCurrentlyPlaying(roomId?: string) {
    try {
      let currentlyPlaying = await axios.get(
        "http://127.0.0.1:4000/spotify/currently-playing"
      );
      setCurrentTrack(currentlyPlaying.data);
      setTimeRemaining(
        currentlyPlaying.data.item.duration_ms -
          currentlyPlaying.data.progress_ms
      );

      // Broadcast the updated track to all members
      // Use the provided roomId or fall back to roomInfo from state
      broadcastCurrentTrack(
        currentlyPlaying.data,
        roomId || roomInfo?.room?.id
      );

      return currentlyPlaying.data;
    } catch (error) {
      console.error("Error getting currently playing:", error);
      return null;
    }
  }

  // Format milliseconds to mm:ss
  const formatTime = (ms: number) => {
    if (!ms) return "00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Kick a member from the room
  const kickMember = async (memberId: string) => {
    try {
      // TODO: Implement the kick functionality
      // This is where you'll make the API call to kick the member
      // await axios.post('http://127.0.0.1:4000/room/kick', { memberId });

      console.log(`Kicking member: ${memberId}`);

      // Notify via socket
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit(
          "message",
          JSON.stringify({
            type: "kick_member",
            roomName: roomInfo.room.id,
            memberId: memberId,
          })
        );
      }

      // Update the members list after successful kick
      setMembers(members.filter((member) => member.id !== memberId));
    } catch (error) {
      console.error("Failed to kick member:", error);
    }
  };

  // Remove a song suggestion
  const removeSuggestion = async (songId: string) => {
    try {
      // TODO: Implement the remove suggestion functionality
      // This is where you'll make the API call to remove the suggestion
      // await axios.delete(`http://127.0.0.1:4000/suggestions/${songId}`);

      console.log(`Removing suggestion: ${songId}`);

      // Notify via socket
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit(
          "message",
          JSON.stringify({
            type: "remove_suggestion",
            roomName: roomInfo.room.id,
            songId: songId,
          })
        );
      }

      // Update the suggestions list after successful removal
      setSuggestedSongs(suggestedSongs.filter((song) => song.id !== songId));
    } catch (error) {
      console.error("Failed to remove suggestion:", error);
    }
  };

  // Add a song to the queue
  const addToQueue = async (songId: string) => {
    try {
      // TODO: Implement the add to queue functionality
      // This is where you'll make the API call to add the song to the queue
      // await axios.post('http://127.0.0.1:4000/spotify/queue', { songId });

      console.log(`Adding song to queue: ${songId}`);

      // Notify via socket
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit(
          "message",
          JSON.stringify({
            type: "song_queued",
            roomName: roomInfo.room.id,
            songId: songId,
          })
        );
      }
    } catch (error) {
      console.error("Failed to add song to queue:", error);
    }
  };

  const leaveRoom = async () => {
    try {
      // TODO: Implement the API call to close the room
      // await axios.post("http://127.0.0.1:4000/room/close");

      // Notify all members the room is closing
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit(
          "message",
          JSON.stringify({
            type: "room_closed",
            roomName: roomInfo.room.id,
          })
        );
      }

      // Disconnect socket
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      console.log("Closing room as host");
      router.push("/"); // Redirect to home page after leaving
    } catch (error) {
      console.error("Failed to close room:", error);
    }
  };

  // Cleanup function for socket
  const cleanupSocketConnection = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  // Improved useEffect for initialization
  useEffect(() => {
    console.log("Host page initializing");
    axios.defaults.headers.common["Authorization"] =
      localStorage.getItem("jwt_token");

    // Single initialization for the entire component
    const initializeRoom = async () => {
      try {
        console.log("Fetching room data");
        const roomData = await axios.get("http://127.0.0.1:4000/room/current");
        console.log("Room data:", roomData.data);

        const roomId = roomData.data?.room?.id;

        setRoomInfo(roomData.data);
        setMembers(roomData.data.room.members);

        // Set up socket with room ID immediately
        if (roomId) {
          console.log("Setting up socket for room:", roomId);
          setupSocketConnection(roomId);
        } else {
          console.error("No room ID found in response");
          return; // Exit early if no room ID
        }

        // Fetch current track after socket is set up
        console.log("Fetching current track");
        const currentTrackData = await axios.get(
          "http://127.0.0.1:4000/spotify/currently-playing"
        );
        setCurrentTrack(currentTrackData.data);
        setTimeRemaining(
          currentTrackData.data.item.duration_ms -
            currentTrackData.data.progress_ms
        );

        // Broadcast with slight delay to ensure socket is connected, and pass roomId directly
        setTimeout(() => {
          console.log("Broadcasting track after setup");
          broadcastCurrentTrack(currentTrackData.data, roomId);
        }, 1000);

        // Set up polling for track updates
        const interval = setInterval(async () => {
          console.log("Polling for track updates");
          await getCurrentlyPlaying(roomId);
        }, 30000);

        return () => {
          console.log("Cleaning up interval");
          clearInterval(interval);
        };
      } catch (error) {
        console.error("Error initializing room:", error);
      }
    };

    initializeRoom();

    // Clean up everything when component unmounts
    return () => {
      console.log("Host page unmounting, cleaning up resources");
      cleanupSocketConnection();
    };
  }, []);

  // Remove the second useEffect that depends on roomInfo.room.id
  // since we're handling everything in one useEffect now

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Room Info Section */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6 shadow-lg">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold">
            {roomInfo?.room?.roomName || "Loading room..."}
          </h1>
          <button
            onClick={leaveRoom}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
          >
            Close Room
          </button>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-300">
              Room Code:{" "}
              <span className="font-mono text-white bg-gray-700 px-2 py-1 rounded">
                {roomInfo?.room?.inviteCode || "..."}
              </span>
            </p>
            <p className="text-gray-300 text-sm mt-1">
              Share this code with friends to join
            </p>
          </div>
          <div className="bg-green-600 px-3 py-1 rounded-full text-sm">
            Host
          </div>
        </div>
      </div>

      {/* Connection Status Indicator */}
      <div
        className={`px-4 py-2 mb-4 rounded-md text-center text-sm ${
          isConnected
            ? "bg-green-900 text-green-200"
            : "bg-red-900 text-red-200"
        }`}
      >
        {isConnected
          ? `Broadcasting to ${members.length - 1} members`
          : "Setting up room broadcast..."}
      </div>

      {/* Currently Playing Section */}
      {currentTrack && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-3">Now Playing</h2>
          <div className="flex items-center">
            {currentTrack.item.album.images?.[0]?.url && (
              <div className="mr-4 flex-shrink-0">
                <img
                  src={currentTrack.item.album.images[0].url}
                  alt="Album cover"
                  width={120}
                  height={120}
                  className="rounded-md shadow-md"
                />
              </div>
            )}
            <div className="flex-grow">
              <h3 className="text-lg font-medium">{currentTrack.item.name}</h3>
              <p className="text-gray-300">
                {currentTrack.item.artists
                  .map((artist: any) => artist.name)
                  .join(", ")}
              </p>
              <p className="text-gray-400 text-sm">
                {currentTrack.item.album.name}
              </p>

              <div className="mt-2">
                <div className="h-2 bg-gray-700 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{
                      width: `${
                        (currentTrack.progress_ms /
                          currentTrack.item.duration_ms) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{formatTime(currentTrack.progress_ms)}</span>
                  <span>{formatTime(currentTrack.item.duration_ms)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suggested Songs Section */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-3">Song Suggestions</h2>
        {suggestedSongs.length > 0 ? (
          <ul className="divide-y divide-gray-700">
            {suggestedSongs.map((song) => (
              <li key={song.id} className="py-3 flex items-start">
                <div className="mr-3 flex-shrink-0">
                  {song.albumArt ? (
                    <img
                      src={song.albumArt}
                      alt={`${song.title} album art`}
                      width={60}
                      height={60}
                      className="rounded-md"
                    />
                  ) : (
                    <div className="w-[60px] h-[60px] bg-gray-700 rounded-md flex items-center justify-center text-gray-500">
                      <span>No Image</span>
                    </div>
                  )}
                </div>
                <div className="flex-grow">
                  <h3 className="text-base font-medium">{song.title}</h3>
                  <p className="text-gray-400 text-sm">{song.artist}</p>
                  <p className="text-gray-500 text-xs">
                    Suggested by: {song.suggestedBy}
                  </p>
                </div>
                <div className="flex space-x-2 ml-2">
                  <button
                    onClick={() => addToQueue(song.id)}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs py-1 px-2 rounded"
                  >
                    Add to Queue
                  </button>
                  <button
                    onClick={() => removeSuggestion(song.id)}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs py-1 px-2 rounded"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 text-center py-4">
            No song suggestions yet
          </p>
        )}
      </div>

      {/* Members Section */}
      <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
        <h2 className="text-xl font-semibold mb-3">
          Members ({members?.length || 0})
        </h2>
        <ul className="divide-y divide-gray-700">
          {members &&
            members.map((member, index) => (
              <li key={member.id || index} className="py-3 flex items-center">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center mr-3">
                  {index + 1}
                </div>
                <div className="flex-grow">
                  <p className="text-sm truncate max-w-[300px]">
                    {member.userId.substring(0, 20)}...
                  </p>
                </div>
                <div className="flex items-center">
                  {member.id === roomInfo?.room?.hostId ? (
                    <span className="text-xs bg-green-600 px-2 py-1 rounded-full">
                      Host
                    </span>
                  ) : (
                    <button
                      onClick={() => kickMember(member.id)}
                      className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-full ml-2"
                    >
                      Kick
                    </button>
                  )}
                </div>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
