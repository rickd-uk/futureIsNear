import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help & About — LinkX",
  description: "Learn how to use LinkX.",
};

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 px-6 py-4 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-white text-xl font-bold flex items-center gap-2 hover:opacity-90 transition-opacity">
            <img src="/android-chrome-192x192.png" alt="LinkX" className="w-7 h-7 rounded-md" />
            <span>LinkX</span>
          </Link>
          <Link href="/" className="text-white/80 text-sm hover:text-white transition-colors">
            ← Back
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-8">

        <section>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Help &amp; About</h1>
          <p className="text-gray-500 text-sm">Everything you need to know about LinkX.</p>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-3">
          <h2 className="text-base font-semibold text-gray-900">What is LinkX?</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            LinkX is a community link aggregator — a place to discover, share, and vote on links that matter.
            Submit articles, tools, videos, or anything worth sharing. The best links rise to the top.
          </p>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Getting Started</h2>
          <ol className="space-y-3 text-sm text-gray-600">
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
              <span><strong className="text-gray-800">Create an account</strong> — click <em>Sign up</em> on the login page. Choose a username and password.</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
              <span><strong className="text-gray-800">Submit a link</strong> — once logged in, tap the <strong>+</strong> button. Paste a URL and the title fills in automatically.</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
              <span><strong className="text-gray-800">Vote</strong> — click the vote button on any link. You have a daily vote budget — spread them across links you find valuable.</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">4</span>
              <span><strong className="text-gray-800">Make it public</strong> — links are private by default. Assign a category and toggle <em>Make public</em> to share with everyone.</span>
            </li>
          </ol>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-3">
          <h2 className="text-base font-semibold text-gray-900">Feeds &amp; Categories</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Use the feed switcher to view <strong>Hot</strong> (trending by votes), <strong>New</strong> (latest first),
            <strong> Mine</strong> (your submissions), or the <strong>Public</strong> feed.
            Filter by category using the bar below the header.
          </p>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-3">
          <h2 className="text-base font-semibold text-gray-900">Browser Extension</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Install the <strong>LinkX</strong> browser extension to submit any page with one click.
            The extension reads the page title and description automatically — just pick a category and submit.
          </p>
          <p className="text-sm text-gray-500">
            Available on the Chrome Web Store — search <em>&ldquo;LinkX&rdquo;</em>.
          </p>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-3">
          <h2 className="text-base font-semibold text-gray-900">Privacy</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Links you submit are private unless you explicitly make them public.
            Your email address (if provided) is never displayed publicly.
          </p>
        </section>

      </main>

      <footer className="text-center text-xs text-gray-400 pb-8">
        <Link href="/" className="hover:text-gray-600 transition-colors underline underline-offset-2">← Back to LinkX</Link>
      </footer>
    </div>
  );
}
