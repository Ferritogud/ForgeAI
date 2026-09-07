import LegalLayout from "@/components/LegalLayout";

export const metadata = { title: "Privacy Policy — ForgeAI" };

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="September 2026">
      <p>
        ForgeAI (&quot;we&quot;, &quot;us&quot;) is a small, independently-run project. This page explains, in plain
        language, what data we collect and what we do with it.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account info</strong>: your name and email address, and either a hashed password (if you sign up
          with email/password) or your Google account identity (if you use &quot;Continue with Google&quot;). We
          never see or store your Google password.
        </li>
        <li>
          <strong>Your projects</strong>: goals, milestones, tasks, notes, and chat messages you create in ForgeAI,
          stored so they sync across your devices.
        </li>
        <li>
          <strong>Usage</strong>: how many AI tokens you&apos;ve used this month, so we can enforce plan limits.
        </li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To run your account (sign-in, syncing your projects across devices).</li>
        <li>To generate your execution plans and chat replies using AI (see below).</li>
        <li>To send you a password reset email if you request one.</li>
      </ul>

      <h2>Who we share it with</h2>
      <p>We don&apos;t sell your data. We do rely on a few outside services to run ForgeAI:</p>
      <ul>
        <li>
          <strong>Anthropic</strong> — when you generate a plan or chat with ForgeAI, the relevant project content
          (your goal, milestones, and messages) is sent to Anthropic&apos;s Claude API to produce a response. See{" "}
          <a href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noopener noreferrer">
            Anthropic&apos;s privacy policy
          </a>
          .
        </li>
        <li>
          <strong>Google</strong> — only if you choose &quot;Continue with Google&quot;, to verify your identity.
        </li>
        <li>
          <strong>Resend</strong> — to deliver password reset emails.
        </li>
        <li>
          <strong>Vercel &amp; Neon</strong> — our hosting and database providers, who store the data described
          above on our behalf.
        </li>
      </ul>

      <h2>Your choices</h2>
      <ul>
        <li>You can export all your project data at any time from Settings.</li>
        <li>You can delete individual projects, or clear all projects, from Settings.</li>
        <li>
          To delete your account entirely, email us and we&apos;ll remove your account and associated data.
        </li>
      </ul>

      <h2>Contact</h2>
      <p>Questions about this policy? Reach out through the contact info on our GitHub repository.</p>
    </LegalLayout>
  );
}
