import Link from 'next/link';
import PageHero from '@/components/PageHero';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <PageHero
        subtitle="Legal"
        title="Terms of Service"
        description="The rules that govern your use of GemFitness memberships, classes, and facilities."
        backgroundImage="/images/training_at_gem.png"
      />

      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto prose prose-gray prose-headings:font-black prose-a:text-orange-600">
          <p className="text-sm text-gray-500">Last updated: March 17, 2026</p>

          <h2>1. Agreement</h2>
          <p>
            By creating an account, purchasing a membership or day pass, or using GemFitness
            facilities and services in Tema, Ghana, you agree to these Terms of Service.
          </p>

          <h2>2. Memberships &amp; payments</h2>
          <p>
            Membership fees, registration fees, class bookings, and event tickets are charged as
            displayed at checkout. Paid plans renew according to the selected duration unless
            cancelled or paused according to gym policy. Day passes are non-transferable and valid
            for the stated visit date.
          </p>

          <h2>3. Facility use &amp; conduct</h2>
          <p>
            Members and guests must follow staff instructions, respect equipment and other patrons,
            and complete any required health screening (including PAR-Q+) before training. GemFitness
            may suspend access for safety violations, abusive behaviour, or unpaid fees.
          </p>

          <h2>4. Classes, events &amp; cancellations</h2>
          <p>
            Class and event schedules may change. Bookings should be cancelled within the stated
            window to avoid losing credits. Refunds for paid events follow the policy communicated
            at registration.
          </p>

          <h2>5. Liability</h2>
          <p>
            Physical training involves inherent risk. You participate at your own risk and are
            responsible for disclosing medical conditions. To the fullest extent permitted by
            Ghanaian law, GemFitness is not liable for injuries arising from ordinary use of the
            facility except where caused by our negligence.
          </p>

          <h2>6. Accounts</h2>
          <p>
            Keep your login credentials confidential. QR codes and membership IDs are for your use
            only and must not be shared.
          </p>

          <h2>7. Contact</h2>
          <p>
            Questions about these terms:{' '}
            <a href="mailto:info@gemfitness.fit">info@gemfitness.fit</a> or visit our{' '}
            <Link href="/contact">contact page</Link>.
          </p>
        </div>
      </section>
    </div>
  );
}
