
import { BookingForm } from '@/components/booking-form';
import { getServices } from '@/lib/services-db';

export default async function BookingPage() {
  const services = await getServices();
  return (
    <div className="container mx-auto max-w-3xl px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary">
          Agende sua Experiência
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Siga os passos para garantir o seu horário de bem-estar.
        </p>
      </div>
      <BookingForm services={services} />
    </div>
  );
}
