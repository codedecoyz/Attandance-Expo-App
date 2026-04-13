import { ConvexReactClient } from "convex/react";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL || "";

if (!convexUrl) {
  console.warn(
    "Missing Convex environment variable. Please set EXPO_PUBLIC_CONVEX_URL in .env file"
  );
}

export const convex = new ConvexReactClient(convexUrl);
