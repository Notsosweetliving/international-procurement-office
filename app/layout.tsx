import type { Metadata } from "next";
import "./globals.css";
import "./v03.css";
import "./v03-fix.css";
import "./v04.css";
import "./v05.css";
import "./v06.css";
import "./v07.css";
import "./v09.css";
import "./v10.css";

const vercelHost =
  process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
export const metadata: Metadata = {
  metadataBase: vercelHost ? new URL(`https://${vercelHost}`) : undefined,
  title: {
    default:
      "International Procurement Office — Global Procurement Intelligence",
    template: "%s | International Procurement Office",
  },
  description:
    "AI-powered procurement intelligence for discovering, qualifying and pursuing public-sector opportunities across global markets.",
  applicationName: "International Procurement Office",
  openGraph: {
    title: "International Procurement Office — Global Procurement Intelligence",
    description:
      "AI-powered procurement intelligence for discovering, qualifying and pursuing public-sector opportunities across global markets.",
    siteName: "International Procurement Office",
    type: "website",
    images: vercelHost
      ? [
          {
            url: "/ipo-logo.png",
            width: 1194,
            height: 1194,
            alt: "International Procurement Office seal",
          },
        ]
      : [],
  },
  twitter: {
    card: "summary",
    title: "International Procurement Office — Global Procurement Intelligence",
    description:
      "AI-powered procurement intelligence for discovering, qualifying and pursuing public-sector opportunities across global markets.",
    images: vercelHost ? ["/ipo-logo.png"] : [],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
