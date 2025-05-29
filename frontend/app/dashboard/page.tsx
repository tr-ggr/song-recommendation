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
      <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
        Spotify Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Playback Controls</h2>
          <div className="flex flex-col gap-4">
            <button
              onClick={checkCurrentlyPlaying}
              disabled={isLoading}
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-full transition-all flex items-center justify-center"
            >
              {isLoading ? "Loading..." : "Check Currently Playing"}
            </button>

            <button
              onClick={checkSongQueue}
              disabled={isLoading}
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-full transition-all flex items-center justify-center"
            >
              {isLoading ? "Loading..." : "Check Song Queue"}
            </button>

            <button
              onClick={logOut}
              disabled={isLoading}
              className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-full transition-all flex items-center justify-center"
            >
              {isLoading ? "Loading..." : "Logout"}
            </button>
          </div>

          {currentlyPlaying && (
            <div className="mt-6 bg-black/20 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Now Playing:</h3>
              <p>{currentlyPlaying?.item?.name || "Nothing playing"}</p>
              {currentlyPlaying?.item?.album?.images?.[0]?.url && (
                <img
                  src={currentlyPlaying.item.album.images[0].url}
                  alt="Album cover"
                  className="w-32 h-32 object-cover mt-2 rounded"
                />
              )}
            </div>
          )}
        </div>

        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Search Songs</h2>
          <form onSubmit={searchSong}>
            <div className="flex gap-2">
              <input
                type="text"
                name="search-item"
                placeholder="Search for a song..."
                className="w-full px-4 py-2 rounded-full bg-white/10 border border-white/10 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-full transition-all"
              >
                {isLoading ? "Searching..." : "Search"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
        </div>
      )}

      {tracks?.items && tracks.items.length > 0 && (
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Search Results</h2>
          <ul className="divide-y divide-white/10">
            {tracks.items.map((track, index) => (
              <li
                key={index}
                className="py-4 flex items-center gap-4 hover:bg-white/5 rounded px-2"
              >
                {track.album.images?.[0]?.url && (
                  <img
                    src={track.album.images[0].url}
                    alt={track.album.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                <div>
                  <p className="font-medium">{track.name}</p>
                  <p className="text-sm text-gray-400">
                    {track.artists.map((artist, artistIndex) => (
                      <span key={artistIndex}>
                        {artist.name}
                        {artistIndex < track.artists.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tracks?.items && tracks.items.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          No tracks found for your search.
        </div>
      )}

      {!tracks?.items && !isLoading && (
        <div className="text-center py-10 text-gray-400">
          Search for something to see results!
        </div>
      )}
    </div>
  );
}
