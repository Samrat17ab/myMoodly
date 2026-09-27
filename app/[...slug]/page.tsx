import { notFound } from "next/navigation";
import MoodlyApp from "../MoodlyApp";
import { isAppPath } from "../lib/routes";

export default async function CatchAll({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  if (!isAppPath(`/${slug.join("/")}`)) notFound();
  return <MoodlyApp />;
}
