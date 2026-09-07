import LegalLayout from "@/components/LegalLayout";

export const metadata = { title: "Terms of Service — ForgeAI" };

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" updated="September 2026">
      <p>
        These terms are intentionally short — ForgeAI is a small, independently-run project, not a large company
        with a legal department. By using ForgeAI, you agree to the points below.
      </p>

      <h2>The service</h2>
      <p>
        ForgeAI helps you turn a goal into an execution plan, using AI to generate and adapt that plan. It&apos;s
        provided &quot;as is&quot;, without guarantees that it will always be available, error-free, or give you
        good advice — treat AI-generated plans as a starting point, not professional advice.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>You&apos;re responsible for keeping your login credentials secure.</li>
        <li>You must provide a real, working email address you control.</li>
        <li>One account per person — don&apos;t share your login with others.</li>
      </ul>

      <h2>Plans and AI usage</h2>
      <ul>
        <li>
          Bronze is free with limited monthly AI usage. Gold and Platinum unlock higher limits and are currently
          granted only via invite codes — there is no self-serve payment yet.
        </li>
        <li>
          AI features run on a shared account with a daily usage cap. If that cap is hit, AI features may
          temporarily fall back to lower-quality or unavailable responses.
        </li>
      </ul>

      <h2>Acceptable use</h2>
      <p>Don&apos;t use ForgeAI to:</p>
      <ul>
        <li>Break the law, or generate content that&apos;s illegal, abusive, or harmful.</li>
        <li>Attempt to abuse, overload, or gain unauthorized access to the service.</li>
        <li>Create multiple accounts to bypass plan limits.</li>
      </ul>
      <p>We may suspend or terminate accounts that violate these terms.</p>

      <h2>Your content</h2>
      <p>
        Your projects, goals, and messages are yours. We store them to provide the service (see our{" "}
        <a href="/privacy">Privacy Policy</a>) and don&apos;t claim ownership over them.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms or the service itself as ForgeAI evolves. Material changes will be reflected here
        with an updated date.
      </p>

      <h2>Contact</h2>
      <p>Questions? Reach out through the contact info on our GitHub repository.</p>
    </LegalLayout>
  );
}
