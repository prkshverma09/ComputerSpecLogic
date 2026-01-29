import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Spec-Logic | AI-Powered PC Building Assistant",
  description:
    "Build your perfect PC with AI-powered compatibility checking. Get intelligent recommendations and ensure all your components work together flawlessly.",
  keywords: [
    "PC builder",
    "computer parts",
    "compatibility checker",
    "gaming PC",
    "workstation",
    "CPU",
    "GPU",
    "motherboard",
    "RAM",
    "PSU",
  ],
  authors: [{ name: "Spec-Logic Team" }],
  openGraph: {
    title: "Spec-Logic | AI-Powered PC Building Assistant",
    description:
      "Build your perfect PC with AI-powered compatibility checking.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Spec-Logic | AI-Powered PC Building Assistant",
    description:
      "Build your perfect PC with AI-powered compatibility checking.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: "bg-background border-border",
              title: "text-foreground",
              description: "text-muted-foreground",
              success: "border-green-500",
              warning: "border-yellow-500",
              error: "border-red-500",
            },
          }}
        />
      </body>
    </html>
  );
}
