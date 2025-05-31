"use client";
import { PartialSearchResult } from "@spotify/web-api-ts-sdk";
import axios from "axios";
import { FormEvent, useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";

export default function Dashboard() {
  const [tracks, setTracks] = useState<PartialSearchResult["tracks"]>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<any>(null);
  const [queue, setQueue] = useState<any>(null);

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

  async function joinRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true);

    const formdata = new FormData(event.currentTarget);
    const inviteCode = formdata.get("invite-code");

    axios
      .post("http://127.0.0.1:4000/room/join", {
        inviteCode: inviteCode,
      })
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

  async function createRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true);

    const formdata = new FormData(event.currentTarget);
    const roomName = formdata.get("room-name");

    axios
      .post("http://127.0.0.1:4000/room/create", {
        roomName: roomName,
      })
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

  async function leaveRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

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
    <div className="container mx-auto p-6 max-w-4xl">
      <form onSubmit={createRoom}>
        <input name="room-name" className="w-2xl bg-amber-400"></input>
        <button type="submit">Submit</button>
      </form>
      <br></br>

      <form onSubmit={joinRoom}>
        <input name="invite-code" className="w-2xl bg-amber-400"></input>
        <button type="submit">Submit</button>
      </form>
      <br></br>

      <form onSubmit={leaveRoom}>
        <input name="room-name" className="w-2xl bg-amber-400"></input>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}
