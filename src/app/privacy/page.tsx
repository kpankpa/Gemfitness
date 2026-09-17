import Link from 'next/link';
import PageHero from '@/components/PageHero';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <PageHero
        subtitle="Legal"
        title="Privacy Policy"
        description="How GemFitness collects, uses, and protects your personal information."
        backgroundImage="/images/training_at_gem.png"
      />

      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto prose prose-gray prose-headings:font-black prose-a:text-orange-600">
          <p className="text-sm text-gray-500">Last updated: March 17, 2026</p>

          <h2>1. Who we are</h2>
          <p>
            GemFitness Tema (&quot;we&quot;, &quot;us&quot;) operates the gym and the gemfitness.fit
            website and member systems. Contact:{' '}
            <a href="mailto:info@gemfitness.fit">info@gemfitness.fit</a>.
          </p>

          <h2>2. Information we collect</h2>
          <ul>
            <li>Account details: name, email, phone, date of birth, emergency contacts</li>
            <li>Membership, payment, check-in, class, and event records</li>
            <li>Health screening responses (e.g. PAR-Q+) you choose to submit</li>
            <li>Messages you send via the contact form</li>
            <li>Technical data such as session cookies needed to keep you signed in</li>
          </ul>

          <h2>3. How we use information</h2>
          <p>
            We use your data to provide memberships and access control, process payments, send
            transactional emails (receipts, reminders, booking confirmations), improve safety, and
            respond to enquiries. We do not sell your personal data.
          </p>

          <h2>4. Sharing</h2>
          <p>
            We share data with payment processors (e.g. Paystack), email delivery providers (e.g.
            Resend), and hosting infrastructure only as needed to run the service. Staff with
            appropriate roles can access member records to operate the gym.
          </p>

          <h2>5. Retention &amp; security</h2>
          <p>
            We retain membership and payment records as required for operations and legal
            obligations. Passwords are hashed; access to admin tools is role-restricted.
          </p>

          <h2>6. Your choices</h2>
          <p>
            You may update profile details from your member dashboard, manage notification
            preferences where available, and request access or correction by contacting us. You may
            also opt out of non-essential marketing emails.
          </p>

          <h2>7. More information</h2>
          <p>
            See our <Link href="/terms">Terms of Service</Link> or{' '}
            <Link href="/contact">contact us</Link> with privacy questions.
          </p>
        </div>
      </section>
    </div>
  );
}
