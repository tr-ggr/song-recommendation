"use client";

import { Music, Users } from "lucide-react";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface RoomLayoutProps {
  children: ReactNode;
}

export default function RoomLayout({ children }: RoomLayoutProps) {
  const pathname = usePathname();
  const isHost = pathname.includes("/host");

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black">
      <header className="border-b border-purple-500/20 bg-black/40 backdrop-blur-sm">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <div className="flex items-center">
            <Music className="h-6 w-6 text-green-500 mr-2" />
            <h1 className="text-xl font-bold text-white">Song Party!</h1>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`px-3 py-1 rounded-full text-sm ${
                isHost ? "bg-purple-600" : "bg-blue-600"
              }`}
            >
              <Users className="h-4 w-4 inline mr-1" />
              {isHost ? "Host" : "Member"}
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">{children}</main>
    </div>
  );
}
