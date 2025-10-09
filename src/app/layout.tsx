import "@/lib/polyfills/url-canparse";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppLayout from "@/components/layout/AppLayout";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "WerkStudentJobs - AI-Powered Job Applications for Students",
  description: "Find Werkstudent jobs in Germany. Upload your resume, get AI-matched with relevant positions, and generate tailored applications in seconds.",
  keywords: ["werkstudent", "AI", "job applications", "student jobs", "germany", "resume builder"],
  authors: [{ name: "Scintive" }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}
