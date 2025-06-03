"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";

export default function HostPage() {
  const [members, setMembers] = useState<any[]>();
  const [roomInfo, setRoomInfo] = useState<any>();
  const [currentTrack, setCurrentTrack] = useState<any>();
  const [timeRemaining, setTimeRemaining] = useState<number>();
  const router = useRouter();

  async function fetchAllData() {
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

    return (
      currentTrackData.data.item.duration_ms - currentTrackData.data.progress_ms
    );
  }

  async function getCurrentlyPlaying() {
    let currentlyPlaying = await axios.get(
      "http://127.0.0.1:4000/spotify/currently-playing"
    );
    setCurrentTrack(currentlyPlaying.data);
    setTimeRemaining(
      currentlyPlaying.data.item.duration_ms - currentlyPlaying.data.progress_ms
    );
    return currentlyPlaying;
  }

  useEffect(() => {
    axios.defaults.headers.common["Authorization"] =
      localStorage.getItem("jwt_token");

    fetchAllData().then(() => {
      console.log(timeRemaining);
      const interval = setInterval(
        getCurrentlyPlaying,
        timeRemaining! || 50000
      );
      return () => clearInterval(interval); // clean up interval on component unmount
    });
  }, []);

  return (
    <div>
      <div>{JSON.stringify(roomInfo)}</div>
      <br></br>
      <div>{JSON.stringify(members)}</div>
      <br></br>
      <div>{currentTrack ? <div>{currentTrack.item.name}</div> : ""}</div>

      <div>{timeRemaining}</div>
    </div>
  );
}
