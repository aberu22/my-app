import Link from "next/link";

export const metadata = {
  title: "Acceptable Use Policy — FantasyVision.AI",
  description: "Rules for using FantasyVision.AI's AI services safely and legally.",
};

export default function AUPPage() {
  const lastUpdated = "September 10, 2025";

  const aup = `
Acceptable Use Policy (AUP) 
Last updated: ${lastUpdated}

This Acceptable Use Policy (“AUP”) forms part of our Terms of Service.  
If you see content or behavior that violates this AUP, report it to [abuse@yourdomain.com].

1) Prohibited Content
- ❌ Child sexual abuse material (CSAM) or sexualization of minors (including fictional or AI-generated).  
- ❌ Non-consensual intimate imagery (“revenge porn”), deepfakes of private individuals, or biometric misuse.  
- ❌ Explicit sexual content or nudity (unless we clearly state an 18+ section is permitted with proper verification).  
- ❌ Terrorism, trafficking, or instructions promoting serious harm.  
- ❌ Harassment, doxxing, hate speech, threats of violence.  
- ❌ Excessive gore or extreme violence.  
- ❌ Copyright/trademark infringement, pirated content, or counterfeit goods.  
- ❌ Malware, phishing, spam, scraping without permission, or attempts to bypass security filters.

2) Prohibited Conduct
- Attempting to reverse engineer or misuse our models.  
- Circumventing safety systems or content filters.  
- Using outputs in violation of applicable laws (IP, privacy, publicity, export control, sanctions).  
- Using the Service to impersonate, defraud, or mislead.  
- Large-scale scraping, reselling, or unauthorized redistribution of the Service.

3) Enforcement
We may:
- Remove or block content.  
- Suspend or terminate accounts.  
- Report violations to law enforcement (especially CSAM or threats of violence).  
- Preserve evidence consistent with legal obligations.

4) Reporting
To report abuse, email: abuse@FantasyVision.AI.  
If you believe your content was removed by mistake, contact support@yFantasyVision.AI.com.

---

This AUP may be updated periodically. Material changes will be announced in-app or by email. Continued use of the Service constitutes acceptance.
  `;

  return (
    <main className="mx-auto max-w-6xl p-6">
      <header className="mb-8">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
          Acceptable Use Policy
        </h1>
        <p className="text-sm text-neutral-500 mt-2 italic">
          Last updated: {lastUpdated}
        </p>
      </header>

      <article className="prose prose-neutral max-w-none">
        <pre className="whitespace-pre-wrap break-words bg-transparent p-0 m-0">
          {aup}
        </pre>
      </article>

      <hr className="my-10" />

      <p className="prose prose-neutral">
        See also our{" "}
        <Link href="/terms" className="underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline">
          Privacy Notice
        </Link>.
      </p>

      <div className="mt-10 text-sm text-neutral-500">
        <p>© {new Date().getFullYear()} FantasyVision.AI LLC. All rights reserved.</p>
      </div>
    </main>
  );
}
