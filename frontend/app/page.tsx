"use client";

import { useEffect, useState } from "react";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import axios from "axios";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function Login() {
    setIsLoading(true);
    SpotifyApi.performUserAuthorization(
      process.env.NEXT_PUBLIC_SPOTIFY_CLIENT!,
      "http://127.0.0.1:3000",
      [
        "user-top-read",
        "user-read-playback-state",
        "user-modify-playback-state",
        "user-read-currently-playing",
        "user-read-playback-position",
        "user-top-read",
        "user-read-recently-played",
      ],
      (access_token): any => {
        console.log(access_token);

        axios
          .post(
            "http://127.0.0.1:4000/spotify/login-with-accesstoken",
            access_token
          )
          .then((data) => {
            localStorage.setItem("jwt_token", data.data.access_token);
            axios.defaults.headers.common[
              "Authorization"
            ] = `Bearer ${data.data.access_token}`;

            router.push("/dashboard");
          })
          .catch((error) => {
            console.log(error);
            setIsLoading(false);
          });
      }
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-b from-black to-zinc-900">
      <div className="w-full max-w-md bg-black/30 backdrop-blur-lg p-8 rounded-2xl border border-zinc-800 shadow-xl">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-black"
            >
              <path
                d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.5 16.5C16.27 16.73 15.9 16.73 15.67 16.5C13.54 14.81 10.82 14.38 7.68 15.09C7.38 15.16 7.09 14.98 7.02 14.69C6.95 14.39 7.13 14.1 7.42 14.03C10.85 13.25 13.87 13.74 16.28 15.67C16.5 15.9 16.5 16.27 16.28 16.5H16.5ZM17.6 13.9C17.33 14.18 16.88 14.18 16.6 13.9C14.14 11.96 10.36 11.38 7.58 12.38C7.26 12.48 6.93 12.31 6.82 11.99C6.72 11.67 6.9 11.34 7.21 11.23C10.4 10.09 14.55 10.73 17.37 13C17.65 13.28 17.65 13.72 17.37 14L17.6 13.9ZM17.97 11.17C15.06 8.94 10.2 8.7 7.31 9.62C6.93 9.73 6.54 9.52 6.43 9.15C6.31 8.77 6.53 8.38 6.9 8.26C10.21 7.22 15.52 7.5 18.83 10.05C19.17 10.27 19.26 10.72 19.03 11.07C18.81 11.41 18.37 11.5 18.02 11.27L17.97 11.17Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Musical Match</h1>
          <p className="text-zinc-400 text-center max-w-xs">
            Discover new music based on your Spotify listening habits
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-900/70 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-white mb-2">Features:</h2>
            <ul className="space-y-2 text-zinc-400">
              <li className="flex items-center">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="mr-2 text-green-500"
                >
                  <path
                    d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                    fill="currentColor"
                  />
                </svg>
                Track your currently playing songs
              </li>
              <li className="flex items-center">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="mr-2 text-green-500"
                >
                  <path
                    d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                    fill="currentColor"
                  />
                </svg>
                Discover similar tracks
              </li>
              <li className="flex items-center">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="mr-2 text-green-500"
                >
                  <path
                    d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                    fill="currentColor"
                  />
                </svg>
                Create personalized playlists
              </li>
            </ul>
          </div>

          <button
            onClick={Login}
            disabled={isLoading}
            className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3 px-4 rounded-full transition-all flex items-center justify-center group relative overflow-hidden"
          >
            <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform translate-x-0 -skew-x-12 bg-green-600 group-hover:translate-x-full group-hover:skew-x-12"></span>
            <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform skew-x-12 bg-green-400 group-hover:translate-x-full group-hover:-skew-x-12"></span>
            <span className="absolute bottom-0 left-0 w-10 h-20 transition-all duration-100 ease-out transform -translate-x-8 translate-y-10 bg-green-600 -rotate-12"></span>
            <span className="absolute bottom-0 right-0 w-10 h-20 transition-all duration-100 ease-out transform translate-x-10 translate-y-8 bg-green-400 -rotate-12"></span>
            <span className="relative flex items-center">
              {isLoading ? (
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-2"
                >
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.5 16.5C16.27 16.73 15.9 16.73 15.67 16.5C13.54 14.81 10.82 14.38 7.68 15.09C7.38 15.16 7.09 14.98 7.02 14.69C6.95 14.39 7.13 14.1 7.42 14.03C10.85 13.25 13.87 13.74 16.28 15.67C16.5 15.9 16.5 16.27 16.28 16.5H16.5Z"
                    fill="currentColor"
                  />
                </svg>
              )}
              {isLoading ? "Connecting..." : "Login with Spotify"}
            </span>
          </button>
        </div>

        <p className="mt-6 text-xs text-center text-zinc-500">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </main>
  );
}
