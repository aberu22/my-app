// app/terms/page.js
import Link from "next/link";

export const metadata = {
  title: "Terms of Service — [Your Company Name]",
  description: "Terms and Acceptable Use for [Your Company Name].",
};

export default function TermsPage() {
  const lastUpdated = "September 10, 2025";
  

  // Paste/update your full legal text below. Keep it as plain text.
  const terms = `
Terms of Service 

Important: This is a general template for a generative-AI application that offers text-to-video, image-to-video, and text-to-image features. It is not legal advice. Laws vary by country and change often (e.g., privacy, online safety, IP, AI-specific rules). Have a qualified attorney review and adapt this to your business, product, and jurisdictions before publishing.

Last updated: ${lastUpdated}

1) Who we are

These Terms of Service (the “Terms”) govern your access to and use of FantasyVision.Ai’s websites, applications, and services (collectively, the “Service”). “We,” “our,” and “us” refer to [Your Company Name], located at [Address]. If you are accepting these Terms on behalf of an organization, you represent that you have authority to bind that organization.


2) Age requirements

You must be **at least 18 years old** to use the Service.  
We do not knowingly permit individuals under 18 to create an account, access, or use the Service.  
By using the Service, you represent and warrant that you are 18 years of age or older.  
If we become aware that someone under 18 is using the Service, we may suspend or terminate their account immediately.


3) Your account and security

Provide accurate registration information and keep it updated.
Keep your credentials secure; you are responsible for all activity under your account.
Notify us immediately of any unauthorized use or security incident: [security@yourdomain.com].

4) The Service & AI outputs

The Service offers text-to-video, image-to-video, and text-to-image generation and related tools. Outputs may be synthetic and can contain errors or unexpected results. Use outputs with caution.
You are responsible for reviewing, vetting, and complying with all applicable laws when using or sharing outputs.
We may use automated and human moderation to review inputs/outputs for abuse and safety, as described in our Acceptable Use and Safety sections.

5) Licenses and ownership

Your Content. You retain ownership of text, images, videos, prompts, and other content you upload (“User Content”). You grant us a worldwide, non-exclusive license to host, process, transmit, and display User Content and to generate and deliver outputs, solely to provide and improve the Service. Where legally permissible and consistent with our Privacy Notice, we may use de-identified data to improve safety and performance.
Output Rights. Subject to these Terms, applicable law, and third-party rights, you may use the outputs you receive. You are responsible for obtaining permissions for any third-party materials embedded in inputs or outputs (e.g., trademarks, people’s likenesses, copyrighted works) and for complying with publicity, moral, and privacy rights.
Feedback. If you provide feedback, you grant us a royalty-free, irrevocable license to use it for any purpose.

6) Acceptable Use & Zero-Tolerance Policy for Child Safety

Strictly prohibited. You may not use the Service to do any of the following. Violations may result in immediate suspension or termination, content removal, and reports to law enforcement and child-protection organizations where required:

Child sexual exploitation material (CSAM), grooming, sexualization of minors, or any sexual content involving minors (including fictional, AI-generated, or cartoon depictions). We operate a zero-tolerance policy. We preserve and may report relevant information to the National Center for Missing & Exploited Children (NCMEC) or other competent authorities, consistent with the law.
Endangering children: facilitating abuse, trafficking, exploitation, doxxing, or harassment of minors.
Illegal content or activities in any jurisdiction relevant to your use (e.g., threats, hate crimes, incitement to violence, terrorism, non-consensual intimate imagery, bestiality, extreme violence).
IP infringement: uploading or generating content that infringes copyrights, trademarks, or other rights; circumventing DRM or watermarking.
Privacy violations: generating or uploading personal data without consent where required; creating deepfakes of private individuals without a lawful basis; biometric misuse; doxxing.
Malware or abuse: attempting to compromise the Service, scraping without permission, interfering with security or access controls, or spam.
Disallowed sexual content: explicit nudity or sexual acts. (If you operate in regions that allow 18+ content, you must verify age and comply with all local rules.)

Safety measures we may use (not a commitment to monitor all content):
- Automated classifiers, perceptual hashing, and image/video matching to detect known CSAM.
- Watermarking and provenance signals on outputs where feasible.
- Rate limits, content filters, and manual review for suspected abuse.
- Account verification and device/IP checks to prevent evasion.

7) Reporting & enforcement

Report abuse (including suspected CSAM) to [abuse@yourdomain.com]. If there is immediate danger, contact local law enforcement.
We may remove content, restrict features, suspend or terminate accounts, and preserve or disclose information when we believe it is necessary to protect users or comply with law.

8) DMCA / Copyright policy

If you believe content infringes your copyright, send a takedown notice to [dmca@yourdomain.com] with: your contact info; a description of the work; the allegedly infringing material and its location; a statement of good-faith belief; and your signature.
If your content was removed by mistake or misidentification, you may submit a counter-notice. We will follow applicable law in processing notices.

9) Privacy

Our Privacy Notice explains what personal data we collect and how we use it, including moderation, safety, and legal-compliance processing. By using the Service, you consent to these practices.
You must not upload others’ personal data without a lawful basis and necessary permissions.

10) Third-party services

The Service may integrate models, APIs, or hosting from third parties. Their terms and privacy policies may apply in addition to ours.

11) Beta features

Some features may be labeled beta or preview and are provided as-is with reduced support or reliability.

12) Payment & refunds (if applicable)

Fees, billing cycles, taxes, and refund eligibility will be stated at checkout or in your plan description.
We may change prices with reasonable advance notice for recurring plans as permitted by law.

13) Service changes

We may modify, suspend, or discontinue the Service or any feature at any time. If we discontinue a paid feature, we will provide a pro-rata refund where required by law.

14) Compliance & export

You agree to comply with all applicable laws and regulations, including sanctions, export controls, and child-protection laws. You may not use the Service where prohibited by law.

15) Disclaimers

THE SERVICE AND ALL OUTPUTS ARE PROVIDED “AS IS” AND “AS AVAILABLE.” TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES (EXPRESS, IMPLIED, STATUTORY), INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT GUARANTEE ANY PARTICULAR RESULTS, ACCURACY, AVAILABILITY, OR ERROR-FREE OPERATION.

16) Limitation of liability

TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE WILL NOT BE LIABLE FOR (A) INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR (B) ANY LOSS OF PROFITS, REVENUE, DATA, OR GOODWILL. OUR AGGREGATE LIABILITY FOR ALL CLAIMS RELATING TO THE SERVICE WILL NOT EXCEED THE GREATER OF US$100 OR THE AMOUNTS YOU PAID TO US IN THE 12 MONTHS BEFORE THE CLAIM.

17) Indemnification

You will defend, indemnify, and hold us (and our affiliates, officers, employees, and agents) harmless from any claims, losses, and expenses (including attorneys’ fees) arising from or related to your use of the Service, your User Content, or your violation of these Terms or applicable law.

18) Governing law & dispute resolution

These Terms are governed by the laws of [Choose state/country], without regard to conflict-of-laws rules.
Arbitration (optional; consult counsel). Any dispute will be resolved by binding arbitration on an individual basis, and you waive class actions and jury trials. You may include a small-claims court carve-out and an opt-out window (e.g., 30 days after account creation). Specify the forum (e.g., AAA) and rules.

19) Termination

You may stop using the Service at any time. We may suspend or terminate your access for any violation of these Terms or to protect users, our platform, or comply with law. Sections that by their nature should survive do so (e.g., licenses, disclaimers, limitations of liability, indemnity, dispute resolution).

20) Changes to these Terms

We may update these Terms from time to time. If changes are material, we will provide reasonable notice (e.g., by email or in-app). Your continued use after the effective date constitutes acceptance.

21) Contact

FantasyVision LLC
[Address]
Support: [support@yourdomain.com]
Abuse/CSAM reports: [abuse@yourdomain.com]
Security: [security@yourdomain.com]
DMCA: [dmca@yourdomain.com]

Acceptable Use Policy (AUP)

This AUP forms part of the Terms. If you see something that violates this AUP, report it to [abuse@yourdomain.com].

Prohibited content & conduct
- Child safety: Any sexual content involving minors (including fictional/AI-generated), grooming, or endangerment.
- Sexual content: Explicit sexual content or nudity.
- Violence & gore: Extreme or gratuitous violence.
- Harassment & hate: Targeted harassment, threats of violence, or unlawful hate speech.
- IP violations: Copyright or trademark infringement, counterfeit goods.
- Privacy: Non-consensual intimate imagery, deepfakes of private individuals, doxxing, biometric misuse.
- Illegal activity: Terrorism, trafficking, illicit drugs, instructions facilitating serious harm.
- Security abuse: Malware, attempts to bypass safety systems, scraping at scale, or disrupting the Service.

Enforcement
We may block, remove, or filter content; rate-limit or restrict features; suspend or terminate accounts; and report to authorities when necessary.

Model & Safety Disclosures (Transparency Summary)
- AI generation: Outputs are synthetic and may be watermarked or include provenance metadata.
- Data handling: Prompts, inputs, and outputs may be processed for abuse detection and product improvement as permitted by our Privacy Notice.
- Human review: Safety teams may review flagged samples to improve abuse detection and protect users.
- Known-content matching: We may use industry hash-sharing programs for CSAM detection and reporting.

DMCA Notice Instructions (Template)
Send notices to [dmca@yourdomain.com] with the following:
1. Your contact information.
2. Identification of the copyrighted work.
3. Identification of the material to be removed and its location (URL or in-app path).
4. A statement of good-faith belief that the use is not authorized.
5. A statement under penalty of perjury that the notice is accurate and you are authorized.
6. Your physical or electronic signature.
  `;

  return (
    <main className="mx-auto max-w-6xl p-6">
      {/* Page header */}
      <header className="mb-8">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
          Terms of Service
        </h1>
        <p className="text-sm text-neutral-500 mt-2 italic">
          Last updated: {lastUpdated}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Local table of contents */}
        <aside className="lg:col-span-3 order-2 lg:order-1">
          <nav className="sticky top-6 text-sm border rounded-lg p-4 bg-white/50 dark:bg-neutral-900/50 backdrop-blur">
            <p className="font-medium mb-2">On this page</p>
            <ul className="space-y-2 list-disc list-inside">
              <li><a href="#tos" className="hover:underline">Terms of Service</a></li>
              <li><a href="#aup" className="hover:underline">Acceptable Use Policy</a></li>
              <li><a href="#dmca" className="hover:underline">DMCA Notice</a></li>
              <li><a href="#privacy" className="hover:underline">Privacy</a></li>
              <li><a href="#contact" className="hover:underline">Contact</a></li>
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <section className="lg:col-span-9 order-1 lg:order-2">
          <article id="tos" className="prose prose-neutral max-w-none">
            {/* Render as text, but remove the default dark <pre> background */}
            <pre className="whitespace-pre-wrap break-words bg-transparent p-0 m-0">
              {terms}
            </pre>
          </article>

          <hr className="my-10" />

          <p id="privacy" className="prose prose-neutral">
            Looking for our Privacy Notice?{" "}
            <Link href="/privacy" className="underline">
              Read it here
            </Link>
            .
          </p>

          <div className="mt-10 text-sm text-neutral-500" id="contact">
            <p>
              © {new Date().getFullYear()} [Your Company Name]. All rights
              reserved.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
