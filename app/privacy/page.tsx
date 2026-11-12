import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Rasoio",
  description: "How Rasoio (Restaurant OS) collects, uses, and protects personal data."
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen w-full max-w-full overflow-x-clip bg-bg-canvas">
      <div className="section-shell py-10 md:py-14">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/"
            className="text-sm font-semibold text-accent-primary transition hover:text-accent-primary-hover hover:underline"
          >
            ← Back to home
          </Link>
          <h1 className="mt-6 text-3xl font-extrabold tracking-[-0.04em] text-text-primary md:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-text-muted">Last updated: April 12, 2026</p>

          <div className="mt-10 space-y-8 text-sm leading-relaxed text-text-secondary">
            <section className="space-y-3">
              <h2 className="text-base font-bold text-text-primary">1. Who we are</h2>
              <p>
                This policy describes how <strong className="text-text-primary">Rasoio</strong> (“we”, “us”) handles
                information when you use our restaurant POS and related services (“Services”). The marketing site may
                refer to the product as “Restaurant OS”.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-text-primary">2. Information we collect</h2>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong className="text-text-primary">Account and workspace data:</strong> such as name, email,
                  restaurant or business name, workspace identifiers, and credentials (passwords are stored hashed).
                </li>
                <li>
                  <strong className="text-text-primary">Operational POS data:</strong> orders, menu items, payments
                  metadata, and other content you enter while using the product.
                </li>
                <li>
                  <strong className="text-text-primary">Technical data:</strong> IP address, device/browser type,
                  approximate location from IP, and logs needed for security and reliability.
                </li>
                <li>
                  <strong className="text-text-primary">Communications:</strong> messages you send us (e.g. support) and,
                  if enabled, email delivery for account security (e.g. sign-in codes, password reset).
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-text-primary">3. How we use information</h2>
              <p>We use the information above to:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Provide, operate, and improve the Services;</li>
                <li>Authenticate users, secure accounts, and prevent abuse;</li>
                <li>Send service-related and transactional messages where appropriate;</li>
                <li>Comply with law and enforce our terms.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-text-primary">4. Sharing</h2>
              <p>
                We do not sell your personal information. We may share data with subprocessors that help us run the
                Services (for example cloud hosting, database providers, and email delivery), bound by appropriate
                safeguards and only as needed for their role.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-text-primary">5. Retention</h2>
              <p>
                We keep information for as long as your account is active and as needed to provide the Services, comply
                with legal obligations, resolve disputes, and enforce agreements. Retention periods may vary by data
                type.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-text-primary">6. Security</h2>
              <p>
                We use administrative, technical, and organizational measures designed to protect information. No
                method of transmission or storage is 100% secure.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-text-primary">7. Your choices</h2>
              <p>
                Depending on where you live, you may have rights to access, correct, delete, or restrict certain
                processing of your personal information, or to object or port data. Contact us to make a request. We may
                need to verify your identity before responding.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-text-primary">8. Children</h2>
              <p>The Services are not directed at children under 16, and we do not knowingly collect their data.</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-text-primary">9. International transfers</h2>
              <p>
                If you access the Services from outside the country where our infrastructure is located, your information
                may be processed in other countries with different data protection laws.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-text-primary">10. Changes</h2>
              <p>
                We may update this policy from time to time. We will post the revised version on this page and update
                the “Last updated” date.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-text-primary">11. Contact</h2>
              <p>
                For privacy questions or requests, contact the team responsible for your Rasoio deployment (e.g. your
                workspace administrator) or reach us through the support channel listed on your account or website.
              </p>
            </section>

            <p className="rounded-2xl border border-border-subtle bg-bg-surface p-4 text-xs text-text-muted">
              This page is provided for transparency and does not constitute legal advice. You may want a lawyer to
              review policies for your jurisdiction and use case.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
