import type { Metadata } from "next";
import MoodlyApp from "./MoodlyApp";

export const metadata: Metadata = {
  alternates: { canonical: "https://mymoodly.space/" },
};

export default function Home() {
  return <MoodlyApp />;
}
