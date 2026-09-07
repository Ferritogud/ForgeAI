import Link from "next/link";

export default function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm font-medium text-accent hover:brightness-110 transition-all">
          ← Back to ForgeAI
        </Link>

        <h1 className="text-3xl font-bold tracking-tight text-ink-primary mt-6 mb-1">{title}</h1>
        <p className="text-xs text-ink-faint mb-10">Last updated {updated}</p>

        <div className="flex flex-col gap-6 text-sm text-ink-secondary leading-relaxed [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-ink-primary [&_h2]:mt-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5 [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2">
          {children}
        </div>
      </div>
    </main>
  );
}
