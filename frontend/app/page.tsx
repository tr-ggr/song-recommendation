"use client";

import { useEffect, useState } from "react";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Music,
  Users,
  ThumbsUp,
  ThumbsDown,
  PartyPopper,
  LogIn,
  Loader2,
} from "lucide-react";

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
    <div className="flex flex-col items-center justify-center w-screen min-h-screen bg-gradient-to-b from-purple-900 to-black py-12 px-4">
      <div className="text-center mb-10">
        <div className="flex items-center justify-center mb-4">
          <Music className="h-12 w-12 text-green-500 mr-2" />
          <PartyPopper className="h-12 w-12 text-yellow-400" />
        </div>
        <h1 className="text-5xl font-bold text-white mb-2">Song Party!</h1>
        <p className="text-xl text-gray-300 max-w-xl">
          Host collaborative listening parties for your events. Queue songs,
          vote, and enjoy music together!
        </p>
      </div>

      <Card className="w-full max-w-2xl bg-black/40 border border-purple-500/30 backdrop-blur-sm">
        <CardHeader className="border-b border-purple-500/30">
          <CardTitle className="text-2xl text-white">Join the Party!</CardTitle>
          <CardDescription className="text-gray-300">
            Connect with Spotify to start hosting or join a listening party
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center">
              <Users className="h-10 w-10 text-blue-400 mb-3" />
              <h3 className="text-lg font-semibold text-white">Collaborate</h3>
              <p className="text-gray-400 mt-2">
                Invite friends to join your listening party
              </p>
            </div>
            <div className="flex flex-col items-center">
              <Music className="h-10 w-10 text-green-400 mb-3" />
              <h3 className="text-lg font-semibold text-white">Queue Songs</h3>
              <p className="text-gray-400 mt-2">
                Everyone can add their favorite tracks to the queue
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex space-x-2 mb-3">
                <ThumbsUp className="h-10 w-10 text-green-400" />
                <ThumbsDown className="h-10 w-10 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Vote Tracks</h3>
              <p className="text-gray-400 mt-2">
                Like or dislike songs to shape the playlist
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-purple-500/30 pt-6">
          <Button
            onClick={Login}
            disabled={isLoading}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-8 rounded-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Connect with Spotify
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <div className="mt-8 text-gray-400 text-sm">
        <p>Ready to get the party started? Log in with your Spotify account!</p>
      </div>
    </div>
  );
}
