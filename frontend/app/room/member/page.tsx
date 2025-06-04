"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { motion, PanInfo } from "framer-motion";
import { io, Socket } from "socket.io-client";

type SongRecommendation = {
  id: string;
  title: string;
  artist: string;
  albumArt?: string;
};

export default function MemberPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [roomInfo, setRoomInfo] = useState<any>({});
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<SongRecommendation[]>(
    []
  );
  const [currentRecommendation, setCurrentRecommendation] =
    useState<SongRecommendation | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const router = useRouter();

  async function fetchAllData() {
    try {
      const roomData = await axios.get("http://127.0.0.1:4000/room/current");

      console.log("Room data:", roomData.data);
      setMembers(roomData.data.room.members);
      setRoomInfo(roomData.data);

      // Placeholder data for recommendations
      const placeholderRecommendations = [
        {
          id: "1",
          title: "Sample Song 1",
          artist: "Artist 1",
          albumArt:
            "https://i.scdn.co/image/ab67616d0000b273446832c2aa778eb2bcf59f45",
        },
        {
          id: "2",
          title: "Sample Song 2",
          artist: "Artist 2",
          albumArt:
            "https://i.scdn.co/image/ab67616d0000b273446832c2aa778eb2bcf59f45",
        },
        {
          id: "3",
          title: "Sample Song 3",
          artist: "Artist 3",
          albumArt:
            "https://i.scdn.co/image/ab67616d0000b273446832c2aa778eb2bcf59f45",
        },
      ];
      setRecommendations(placeholderRecommendations);
      if (placeholderRecommendations.length > 0) {
        setCurrentRecommendation(placeholderRecommendations[0]);
      }

      return roomData.data;
    } catch (error) {
      console.error("Failed to fetch data:", error);
      return null;
    }
  }

  // Setup Socket.io connection
  const setupSocketConnection = (roomId: string) => {
    if (!roomId) {
      console.log("No room ID provided for socket connection");
      return;
    }

    console.log("Setting up socket connection for room:", roomId);

    // Create Socket.io connection
    const socket = io("http://127.0.0.1:9000", {
      auth: {
        token: localStorage.getItem("jwt_token"),
      },
      transports: ["websocket", "polling"], // Explicitly set transports
    });

    socketRef.current = socket;

    // Connection events
    socket.on("connect", () => {
      console.log("Connected to Socket.io server with ID:", socket.id);
      setIsConnected(true);

      // Join the room
      socket.emit("join_room", JSON.stringify({ roomName: roomId }));
      console.log("Sent join_room for:", roomId);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from Socket.io server");
      setIsConnected(false);
    });

    // Log all incoming events for debugging
    socket.onAny((event, ...args) => {
      console.log(`Socket event: ${event}`, args);
    });

    // Room events
    socket.on("join_room", (data) => {
      console.log("Join room response:", data);
      if (data.response && data.response.members) {
        setMembers(data.response.members);

        // Request current track after joining
        console.log("Requesting current track after joining");
        socket.emit(
          "request_current_track",
          JSON.stringify({
            roomName: roomId,
          })
        );
      }
    });

    // Add a more generic listener for all message events
    socket.on("message", (data) => {
      console.log("Received raw message event:", data);

      try {
        // Parse the payload if it's a string
        let payload = data.body;
        if (typeof payload === "string") {
          payload = JSON.parse(payload);
        }

        console.log("Parsed message payload:", payload);

        // Handle different message types
        if (payload && payload.type === "currently_playing") {
          console.log("Received currently playing track:", payload.track);
          setCurrentTrack(payload.track);
        } else if (
          payload &&
          payload.type === "kick_member" &&
          payload.memberId === roomInfo?.userId
        ) {
          alert("You have been kicked from the room");
          router.push("/");
        } else if (payload && payload.type === "room_closed") {
          alert("The room has been closed by the host");
          router.push("/");
        }
      } catch (error) {
        console.error("Error processing message:", error, data);
      }
    });
  };

  const formatTime = (ms: number) => {
    if (!ms) return "00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handleSwipe = (info: PanInfo) => {
    const swipeThreshold = 100;

    if (info.offset.x > swipeThreshold) {
      // Swiped right - like the song
      suggestSong(currentRecommendation?.id || "");
      setSwipeDirection("right");
      nextSong();
    } else if (info.offset.x < -swipeThreshold) {
      // Swiped left - skip the song
      setSwipeDirection("left");
      nextSong();
    }
  };

  const nextSong = () => {
    setTimeout(() => {
      setSwipeDirection(null);
      if (recommendations.length > 1) {
        const nextRecommendations = [...recommendations];
        nextRecommendations.shift();
        setRecommendations(nextRecommendations);
        setCurrentRecommendation(nextRecommendations[0]);
      } else {
        setCurrentRecommendation(null);
      }
    }, 300);
  };

  const suggestSong = async (songId: string) => {
    try {
      if (!socketRef.current || !socketRef.current.connected) {
        console.error("Socket not connected, can't suggest song");
        return;
      }

      console.log(`Suggesting song: ${songId}`);

      // Send song suggestion through socket
      socketRef.current.emit(
        "send_song_suggestion",
        JSON.stringify({
          songId: songId,
          roomName: roomInfo?.room?.id,
          song: currentRecommendation,
        })
      );

      console.log("Song suggestion sent");
    } catch (error) {
      console.error("Failed to suggest song:", error);
    }
  };

  const leaveRoom = async () => {
    try {
      console.log("Leaving room as member");

      await axios.post("http://127.0.0.1:4000/room/leave-room");

      // Disconnect socket before redirect
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      router.push("/dashboard"); // Redirect to home page after leaving
    } catch (error) {
      console.error("Failed to leave room:", error);
    }
  };

  // Cleanup function for socket
  const cleanupSocketConnection = () => {
    console.log("Cleaning up socket connection");
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  // Improved useEffect for member page
  useEffect(() => {
    console.log("Member page initializing");
    const token = localStorage.getItem("jwt_token");
    axios.defaults.headers.common["Authorization"] = token;

    // Single initialization function for clarity
    const initializeRoom = async () => {
      try {
        console.log("Fetching room data");
        const roomData = await axios.get("http://127.0.0.1:4000/room/current");

        if (!roomData.data?.room?.id) {
          console.error("No room ID found in response");
          return;
        }

        setMembers(roomData.data.room.members);
        setRoomInfo(roomData.data);

        console.log("Setting up socket for room:", roomData.data.room.id);

        // Create Socket.io connection
        const socket = io("http://127.0.0.1:9000", {
          auth: { token },
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        socketRef.current = socket;

        // Connection events
        socket.on("connect", () => {
          console.log("Connected to Socket.io server with ID:", socket.id);
          setIsConnected(true);

          // Join the room immediately after connecting
          console.log("Joining room:", roomData.data.room.id);
          socket.emit(
            "join_room",
            JSON.stringify({
              roomName: roomData.data.room.id,
            })
          );
        });

        socket.on("connect_error", (error) => {
          console.error("Socket connection error:", error);
          setIsConnected(false);
        });

        socket.on("disconnect", () => {
          console.log("Disconnected from Socket.io server");
          setIsConnected(false);
        });

        // Room events
        socket.on("join_room", (data) => {
          console.log("Join room response:", data);
          if (data.response && data.response.members) {
            setMembers(data.response.members);

            // Request current track after joining
            console.log("Requesting current track after joining");
            socket.emit(
              "request_current_track",
              JSON.stringify({
                roomName: roomData.data.room.id,
              })
            );
          }
        });

        // Debug listener for all events
        socket.onAny((event, ...args) => {
          console.log(`Socket event: ${event}`, args);
        });

        // Listen for messages including currently playing updates
        socket.on("message", (data) => {
          console.log("Received message:", data);

          try {
            // Parse the payload if it's a string
            let payload = data.body;
            if (typeof payload === "string") {
              payload = JSON.parse(payload);
            }

            // Handle different message types
            if (payload.type === "currently_playing") {
              console.log("Updating currently playing:", payload.track);
              setCurrentTrack(payload.track);
            } else if (
              payload.type === "kick_member" &&
              payload.memberId === roomData.data.userId
            ) {
              alert("You have been kicked from the room");
              socket.disconnect();
              router.push("/");
            } else if (payload.type === "room_closed") {
              alert("The room has been closed by the host");
              socket.disconnect();
              router.push("/");
            }
          } catch (error) {
            console.error("Error processing message:", error);
          }
        });

        // Set up placeholder recommendations
        const placeholderRecommendations = [
          {
            id: "1",
            title: "Sample Song 1",
            artist: "Artist 1",
            albumArt:
              "https://i.scdn.co/image/ab67616d0000b273446832c2aa778eb2bcf59f45",
          },
          {
            id: "2",
            title: "Sample Song 2",
            artist: "Artist 2",
            albumArt:
              "https://i.scdn.co/image/ab67616d0000b273446832c2aa778eb2bcf59f45",
          },
          {
            id: "3",
            title: "Sample Song 3",
            artist: "Artist 3",
            albumArt:
              "https://i.scdn.co/image/ab67616d0000b273446832c2aa778eb2bcf59f45",
          },
        ];
        setRecommendations(placeholderRecommendations);
        if (placeholderRecommendations.length > 0) {
          setCurrentRecommendation(placeholderRecommendations[0]);
        }
      } catch (error) {
        console.error("Failed to initialize room:", error);
      }
    };

    initializeRoom();

    // Clean up when component unmounts
    return () => {
      console.log("Member page unmounting");
      cleanupSocketConnection();
    };
  }, []);

  // For debugging
  useEffect(() => {
    console.log("Current track state:", currentTrack ? "exists" : "null");
  }, [currentTrack]);

  useEffect(() => {
    console.log(
      "Socket connection state:",
      isConnected ? "connected" : "disconnected"
    );
  }, [isConnected]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-blue-900 p-4 mb-6 rounded-md">
        <h3 className="text-lg font-medium">Debug Info</h3>
        <p>Connected: {isConnected ? "Yes" : "No"}</p>
        <p>Room ID: {roomInfo?.room?.id || "Unknown"}</p>
        <p>Current Track: {currentTrack ? "Loaded" : "Not loaded"}</p>
        <p>Members: {members?.length || 0}</p>
      </div>

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
            Leave Room
          </button>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-gray-300">
            Room Code:{" "}
            <span className="font-mono text-white bg-gray-700 px-2 py-1 rounded">
              {roomInfo?.room?.inviteCode || "..."}
            </span>
          </p>
          <div className="bg-blue-600 px-3 py-1 rounded-full text-sm">
            Member
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
        {isConnected ? "Connected to session" : "Connecting to session..."}
      </div>

      {/* Currently Playing Section */}
      {currentTrack ? (
        <div className="bg-gray-800 rounded-lg p-4 mb-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-3">Now Playing</h2>
          <div className="flex items-center">
            {currentTrack.item &&
            currentTrack.item.album &&
            currentTrack.item.album.images?.[0]?.url ? (
              <div className="mr-4 flex-shrink-0">
                <img
                  src={currentTrack.item.album.images[0].url}
                  alt="Album cover"
                  width={80}
                  height={80}
                  className="rounded-md shadow-md"
                />
              </div>
            ) : (
              <div className="w-20 h-20 bg-gray-700 flex items-center justify-center mr-4">
                <span className="text-gray-500">No Image</span>
              </div>
            )}
            <div className="flex-grow">
              <h3 className="text-lg font-medium">
                {currentTrack.item?.name || "Unknown Track"}
              </h3>
              <p className="text-gray-300">
                {currentTrack.item?.artists
                  ?.map((artist: any) => artist.name)
                  .join(", ") || "Unknown Artist"}
              </p>
              <div className="mt-2">
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{
                      width: `${
                        ((currentTrack.progress_ms || 0) /
                          (currentTrack.item?.duration_ms || 1)) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{formatTime(currentTrack.progress_ms || 0)}</span>
                  <span>{formatTime(currentTrack.item?.duration_ms || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg p-4 mb-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-3">Now Playing</h2>
          <p className="text-gray-400 text-center py-8">
            Nothing is playing right now
          </p>
        </div>
      )}

      {/* Rest of your component remains the same */}
      {/* Song Recommendation Swipe Interface */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-3">Suggest Songs</h2>
        <p className="text-gray-400 text-sm mb-4">
          Swipe right to suggest a song, swipe left to skip.
        </p>

        <div className="relative h-[300px] flex items-center justify-center mb-4">
          {currentRecommendation ? (
            <motion.div
              className="absolute w-full max-w-xs bg-gray-700 p-4 rounded-lg shadow-xl"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(e, info) => handleSwipe(info)}
              animate={
                swipeDirection === "left"
                  ? { x: -500, opacity: 0, rotate: -20 }
                  : swipeDirection === "right"
                  ? { x: 500, opacity: 0, rotate: 20 }
                  : { x: 0 }
              }
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col items-center">
                {currentRecommendation.albumArt ? (
                  <img
                    src={currentRecommendation.albumArt}
                    alt={`${currentRecommendation.title} album art`}
                    width={180}
                    height={180}
                    className="rounded-md shadow-md mb-4"
                  />
                ) : (
                  <div className="w-[180px] h-[180px] bg-gray-600 rounded-md flex items-center justify-center text-gray-500 mb-4">
                    <span>No Image</span>
                  </div>
                )}
                <h3 className="text-lg font-medium text-center">
                  {currentRecommendation.title}
                </h3>
                <p className="text-gray-300 text-center">
                  {currentRecommendation.artist}
                </p>
              </div>

              <div className="flex justify-between mt-6">
                <button
                  className="bg-red-600 text-white p-2 rounded-full w-12 h-12 flex items-center justify-center"
                  onClick={() => {
                    setSwipeDirection("left");
                    nextSong();
                  }}
                >
                  ✗
                </button>
                <button
                  className="bg-green-600 text-white p-2 rounded-full w-12 h-12 flex items-center justify-center"
                  onClick={() => {
                    suggestSong(currentRecommendation.id);
                    setSwipeDirection("right");
                    nextSong();
                  }}
                >
                  ✓
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="text-gray-400 text-center">
              <p>No more song recommendations available</p>
              <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                Get More Recommendations
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Members Section */}
      <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
        <h2 className="text-xl font-semibold mb-3">
          Members ({members?.length || 0})
        </h2>
        <ul className="divide-y divide-gray-700">
          {members && members.length > 0 ? (
            members.map((member, index) => (
              <li key={member.id || index} className="py-3 flex items-center">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center mr-3">
                  {index + 1}
                </div>
                <div className="flex-grow">
                  <p className="text-sm truncate max-w-[300px]">
                    {member.userId
                      ? member.userId.substring(0, 20) + "..."
                      : "Unknown member"}
                  </p>
                </div>
                {member.id === roomInfo?.room?.hostId && (
                  <span className="text-xs bg-green-600 px-2 py-1 rounded-full">
                    Host
                  </span>
                )}
              </li>
            ))
          ) : (
            <li className="py-3 text-center text-gray-400">No members found</li>
          )}
        </ul>
      </div>
    </div>
  );
}
