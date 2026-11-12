import { notFound } from "next/navigation";

import { BookingForm } from "@/components/public/booking-form";
import { connectToDatabase } from "@/lib/db/connect";
import { resolvePublicTenant } from "@/lib/hotel/public";

export const dynamic = "force-dynamic";

/** Public booking page: only tenants with the rooms module can be reached. */
export default async function PublicBookingPage({ params }: { params: Promise<{ slug: string }> }) {
  await connectToDatabase();
  const { slug } = await params;
  const tenant = await resolvePublicTenant(slug);
  if (!tenant) notFound();

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-text-primary">{tenant.name}</h1>
        <p className="text-sm text-text-muted">Book a room</p>
      </header>
      <BookingForm slug={tenant.slug} hotel={tenant.name} />
    </main>
  );
}
