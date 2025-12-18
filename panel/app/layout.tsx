import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SettingsProvider } from "@/components/SettingsContext";
import { WindowProvider } from "@/components/WindowContext";
import WindowManager from "@/components/WindowManager";
import ConditionalMenuBar from "@/components/ConditionalMenuBar";
import MinimizedWindowsBar from "@/components/MinimizedWindowsBar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "File Manager Dashboard",
  description: "Personal File Management Dashboard",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <SettingsProvider>
          <WindowProvider>
            <ConditionalMenuBar />
            {children}
            <WindowManager />
            <MinimizedWindowsBar />
          </WindowProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
