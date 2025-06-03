"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Loader2, Music } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function RoomLoader() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function checkRoomDetails() {
      try {
        const res = await axios.get("http://127.0.0.1:4000/room/current", {
          headers: {
            authorization: `Bearer ${localStorage.getItem("jwt_token")}`,
          },
        });

        console.log(res);
        alert("1");

        if (!res.data || !res.data.room) {
          router.push("/dashboard");
          return;
        }

        if (res.data.isHost) {
          router.push("/room/host");
        } else {
          router.push("/room/member");
        }
      } catch (err) {
        console.error("Failed to fetch room details:", err);
        setError("Failed to load your room details. Please try again.");
        setIsLoading(false);
      }
    }

    const timeoutId = setTimeout(() => {
      checkRoomDetails();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black flex flex-col items-center justify-center p-4">
      <Card className="bg-black/40 border border-purple-500/30 backdrop-blur-sm p-8 max-w-md w-full text-center">
        {isLoading ? (
          <>
            <div className="flex justify-center mb-6">
              <Music className="h-12 w-12 text-green-500 animate-pulse" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Joining your party...
            </h2>
            <div className="flex justify-center mt-6">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
          </>
        ) : error ? (
          <>
            <h2 className="text-xl font-semibold text-white mb-4">Oops!</h2>
            <p className="text-red-400 mb-6">{error}</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
            >
              Back to Dashboard
            </button>
          </>
        ) : null}
      </Card>
    </div>
  );
}
