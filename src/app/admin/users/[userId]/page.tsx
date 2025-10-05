
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { BackButton } from '@/components/back-button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { EditUserForm } from '@/components/admin/users/edit-user-form';
import type { Profile } from '@/types/profile';
import { User, Shield, CreditCard, Activity, BarChart3, CalendarCheck2 } from 'lucide-react';
import { getServices } from '@/lib/services-db';
import { subDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"


type UserPageProps = {
  params: Promise<{
    userId: string;
  }>;
};

type PastBooking = {
  date: string;
  duration: number;
  service_id: string;
};

const PLAN_MINUTES: { [key: string]: number } = {
  'Plano Bronze': 50,
  'Plano Prata': 90,
  'Plano Gold': 130,
  'Sem Plano': 0,
};

const getInitials = (name: string | undefined | null) => {
  if (!name) return '??';
  const names = name.split(' ');
  const initials = names.map((n) => n[0]).join('');
  return initials.length > 2 ? initials.substring(0, 2) : initials;
};

async function getUserData(userId: string) {
  const supabase = createClient({ auth: { persistSession: false } });

  // Fetch profile and user data in parallel
  const profilePromise = supabase
    .from('profiles')
    .select(`*`)
    .eq('id', userId)
    .single();

  const userPromise = supabase.auth.admin.getUserById(userId);

  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const today = format(new Date(), 'yyyy-MM-dd');

  const pastBookingsPromise = supabase
    .from('bookings')
    .select('date, duration, service_id')
    .eq('user_id', userId)
    .eq('status', 'Confirmado')
    .gte('date', thirtyDaysAgo)
    .lte('date', today)
    .order('date', { ascending: false });

  const servicesPromise = getServices();

  const [
    { data: profileData, error: profileError },
    { data: userData, error: userError },
    { data: pastBookingsData, error: pastBookingsError },
    services
  ] = await Promise.all([profilePromise, userPromise, pastBookingsPromise, servicesPromise]);


  if (profileError || !profileData || userError) {
    console.error("Error fetching user data for details page:", profileError || userError);
    notFound();
  }

  if (pastBookingsError) {
    console.error("Error fetching past bookings for details page:", pastBookingsError);
  }

  // Combine profile and auth user data
  const profile: Profile = {
    ...profileData,
    created_at: userData.user?.created_at || profileData.created_at, // Prioritize auth user creation date
    email: userData.user?.email || profileData.email, // Prioritize auth user email
  };

  return { 
    profile,
    pastBookings: (pastBookingsData || []) as PastBooking[],
    services
  };
}


export default async function UserProfileAdminPage(props: UserPageProps) {
  const params = await props.params;
  const { profile, pastBookings, services } = await getUserData(params.userId);

  const subscriptionPlan = profile.subscription_plan || 'Sem Plano';
  const planTotalMinutes = PLAN_MINUTES[subscriptionPlan] || 0;
  const refundedMinutes = profile.refunded_minutes || 0;

  const totalUsedMinutes = pastBookings.reduce((acc, booking) => acc + (booking.duration || 0), 0);
  const baseRemainingMinutes = Math.max(0, planTotalMinutes - totalUsedMinutes);
  const totalAvailableMinutes = baseRemainingMinutes + refundedMinutes;

  const progressPercentage = planTotalMinutes > 0 ? Math.min(100, (totalUsedMinutes / planTotalMinutes) * 100) : 0;

  const serviceMap = new Map(services.map(s => [s.id, s.name]));

  return (
    <div className="container mx-auto max-w-6xl py-12">
      <div className="flex items-center mb-6">
        <BackButton />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: User Info */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader className="flex flex-col items-center text-center space-y-4">
              <Avatar className="h-28 w-28 border-4 border-accent/20">
                <AvatarImage src={profile.avatar_url || ''} alt={profile.full_name || ''} />
                <AvatarFallback className="text-4xl">{getInitials(profile.full_name)}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <CardTitle className="text-2xl">{profile.full_name}</CardTitle>
                <CardDescription>{profile.email}</CardDescription>
              </div>
               {profile.role === 'admin' && (
                 <span className="text-xs font-semibold inline-flex items-center px-2.5 py-0.5 rounded-full bg-accent text-accent-foreground">
                    <Shield className="mr-1.5 h-3.5 w-3.5" />
                    Admin
                 </span>
                )}
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4 pt-4">
                 <div>
                    <p className="font-semibold text-foreground">Membro desde</p>
                    <p>{new Date(profile.created_at).toLocaleDateString('pt-PT')}</p>
                </div>
                 <div>
                    <p className="font-semibold text-foreground">Telefone</p>
                    <p>{profile.phone || 'Não fornecido'}</p>
                  </div>
                 <div>
                    <p className="font-semibold text-foreground">ID do Utilizador</p>
                    <p className="font-mono text-xs bg-muted p-2 rounded-md break-all">{profile.id}</p>
                  </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Editing and Stats */}
        <div className="md:col-span-2 space-y-6">
           <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                    <CreditCard className="w-6 h-6 text-accent" />
                    <div>
                        <CardTitle>Gerir Subscrição</CardTitle>
                        <CardDescription>Altere o plano de subscrição e os minutos de bónus.</CardDescription>
                    </div>
                </div>
              </CardHeader>
              <CardContent>
                <EditUserForm userProfile={profile} />
              </CardContent>
          </Card>
          
           <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                    <Activity className="w-6 h-6 text-accent" />
                    <div>
                        <CardTitle>Atividade e Consumo</CardTitle>
                        <CardDescription>Consumo de minutos e agendamentos nos últimos 30 dias.</CardDescription>
                    </div>
                </div>
              </CardHeader>
              <CardContent>
                 <div className="space-y-4">
                    {subscriptionPlan !== 'Sem Plano' ? (
                        <div className="space-y-2">
                           <div className="flex justify-between items-baseline">
                              <span className="text-sm text-muted-foreground">Consumo do Plano</span>
                              <span className="font-bold">{totalUsedMinutes} / {planTotalMinutes} min</span>
                           </div>
                           <Progress value={progressPercentage} className="h-2" />
                           <div className="grid grid-cols-2 gap-4 text-center mt-4">
                              {refundedMinutes > 0 && (
                                <div className="p-3 bg-muted rounded-md">
                                  <p className="text-xs text-muted-foreground">Min. Bónus</p>
                                  <p className="text-lg font-bold text-green-500">+{refundedMinutes}</p>
                                </div>
                              )}
                              <div className="p-3 bg-muted rounded-md col-span-2">
                                <p className="text-sm text-muted-foreground">Total Disponível</p>
                                <p className="text-2xl font-bold text-primary">{totalAvailableMinutes} min</p>
                              </div>
                           </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">Este utilizador não tem uma subscrição ativa.</p>
                    )}

                    <Separator />

                     <div>
                        <h4 className="mb-4 text-md font-medium flex items-center gap-2">
                          <CalendarCheck2 className="w-5 h-5"/>
                          Histórico Recente
                        </h4>
                        {pastBookings.length > 0 ? (
                           <div className="border rounded-md">
                              <Table>
                                 <TableHeader>
                                    <TableRow>
                                       <TableHead>Data</TableHead>
                                       <TableHead>Serviço</TableHead>
                                       <TableHead className="text-right">Duração</TableHead>
                                    </TableRow>
                                 </TableHeader>
                                 <TableBody>
                                    {pastBookings.slice(0, 5).map((booking, index) => (
                                      <TableRow key={index}>
                                        <TableCell>{format(new Date(booking.date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                                        <TableCell>{serviceMap.get(booking.service_id) || 'Serviço Desconhecido'}</TableCell>
                                        <TableCell className="text-right">{booking.duration} min</TableCell>
                                      </TableRow>
                                    ))}
                                 </TableBody>
                              </Table>
                           </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">Nenhum agendamento confirmado nos últimos 30 dias.</p>
                        )}
                     </div>
                 </div>
              </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

    

    