import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import TopNavbar from "@/components/TopNavbar";
import AuthProvider from "@/components/AuthProvider";
import { NotificationProvider } from "@/components/NotificationContext";
import WeeklyAwardsModal from "@/components/WeeklyAwardsModal";
import { LanguageProvider } from "@/contexts/LanguageContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DevArena",
  description: "DevArena — engineering squad tracker",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <LanguageProvider>
          <NotificationProvider>
            <div className="flex h-screen overflow-hidden bg-background-dark">
              <Sidebar />
              <div className="flex-1 flex flex-col overflow-hidden">
                <TopNavbar />
                <main className="flex-1 overflow-y-auto p-8">{children}</main>
              </div>
            </div>
            <WeeklyAwardsModal />
          </NotificationProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
