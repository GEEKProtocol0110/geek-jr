import Link from "next/link";
import CountingGarden from "@/modules/counting/CountingGarden";
export const metadata = { title: "Counting Garden", description: "Touch, count and explore number stories together. No timer." };
export default function CountingPage() {
  return <main id="main-content" className="activity-page"><div className="mx-auto max-w-3xl"><Link href="/#activities" className="back-link">← All activities</Link><div className="activity-content"><CountingGarden /></div></div></main>;
}
