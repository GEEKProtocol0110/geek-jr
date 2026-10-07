import Link from "next/link";
import GuidedPath from "@/modules/home/GuidedPath";
import ActivityIcon from "@/modules/common/ActivityIcon";
import WordPicture from "@/modules/first-words/WordPicture";

const activities = [
  { title: "Picture Cards", description: "Look at a picture. Say a word.", href: "/cards", tint: "bg-amber-100" },
  { title: "Reading Path", description: "Listen, blend and read together.", href: "/phonics", tint: "bg-sky-100" },
  { title: "Memory Match", description: "Find two pictures that match.", href: "/memory", tint: "bg-emerald-100" },
  { title: "Patterns & Logic", description: "What comes next? You choose!", href: "/patterns", tint: "bg-violet-100" },
  { title: "Story Sequence", description: "Find the next part of the story.", href: "/stories", tint: "bg-rose-100" },
  { title: "First Words", description: "Look, say and play together.", href: "/first-words", tint: "bg-teal-100" },
];

export default function HomePage() {
  return (
    <main id="main-content">
      <section className="home-hero" aria-labelledby="hero-title">
        <div className="hero-grid">
          <div>
            <p className="eyebrow">Welcome, little explorer</p>
            <h1 id="hero-title">Little steps.<br /><em>Big discoveries.</em></h1>
            <p className="hero-description">A picture, a word, a little play. Discover something new together.</p>
            <div className="hero-actions">
              <a className="hero-primary" href="#start">Let’s play <span aria-hidden="true">→</span></a>
              <Link className="hero-secondary" href="/parent">For grown-ups</Link>
            </div>
            <p className="hero-reassurance">No account needed. Take your time.</p>
          </div>
          <div className="hero-play-art" aria-hidden="true">
            <div className="hero-picture picture-ball"><WordPicture word="BALL" /><span>Look</span></div>
            <div className="hero-picture picture-cat"><WordPicture word="CAT" /><span>Say</span></div>
            <div className="hero-picture picture-book"><WordPicture word="BOOK" /><span>Play</span></div>
            <span className="hero-spark">✦</span>
          </div>
        </div>
      </section>
      <GuidedPath />
      <div className="activities-section">
        <details className="activity-library" id="activities">
          <summary><span><b>More things to try</b><small>Find a picture, a puzzle or a little story.</small></span></summary>
          <div className="activity-grid">
            {activities.map((activity) => (
              <Link key={activity.href} href={activity.href} className="activity-tile">
                <span className={`tile-icon ${activity.tint}`} aria-hidden="true"><ActivityIcon href={activity.href} /></span>
                <div><h3>{activity.title}</h3><p>{activity.description}</p></div>
                <span className="tile-arrow" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </details>
        <aside className="family-note"><span aria-hidden="true">♡</span><div><h2>A little is plenty.</h2><p>Follow your child’s interest. A few minutes together, then try the idea away from the screen.</p></div><Link href="/parent">Grown-up guide <span aria-hidden="true">→</span></Link></aside>
        <p className="home-note">Settings and progress stay in this browser.</p>
      </div>
    </main>
  );
}
