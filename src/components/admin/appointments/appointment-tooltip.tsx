'use client';

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { format, addMinutes } from "date-fns";
import type { Appointment, UserProfile } from "@/types/appointment";
import type { Service } from "@/app/admin/services/page";

const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('');
};

interface AppointmentTooltipProps {
    app: Appointment;
    anchorRect: DOMRect | null;
    services: Service[];
    users: UserProfile[];
}

export function AppointmentTooltip({ 
    app, 
    anchorRect, 
    services, 
    users
}: AppointmentTooltipProps) {
    if (!anchorRect) return null;

    const isBlocked = app.payment_method === 'blocked';
    
    // Find Service & Price
    const service = services.find(s => s.name === app.service_name);
    const tier = service?.pricing_tiers?.find((t: any) => t.duration === app.duration);
    const price = tier?.price || 0;
    
    // Find User
    const user = users.find(u => u.id === app.user_id);
    
    // Times
    const startDate = new Date(app.date);
    const endDate = addMinutes(startDate, app.duration);

    // Positioning
    const TOOLTIP_WIDTH = 300;
    const GAP = 10;
    
    // Default: Show to the right
    let left = anchorRect.right + GAP;
    let top = anchorRect.top;

    // If overflows right edge, show to the left
    if (typeof window !== 'undefined' && left + TOOLTIP_WIDTH > window.innerWidth) {
        left = anchorRect.left - TOOLTIP_WIDTH - GAP;
    }

    const isPaid = app.status === 'Concluído' || ['card', 'minutes', 'cash', 'gift', 'online'].includes(app.payment_method);
    const headerBgClass = isPaid ? "bg-slate-500" : "bg-blue-600";
    
    return (
        <div 
            className="fixed z-[70] w-[300px] bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden pointer-events-none animate-in fade-in zoom-in-95 duration-100 flex flex-col"
            style={{ top: top, left: left }}
        >
             <div className={`${headerBgClass} px-4 py-3 text-white flex justify-between items-center shadow-sm`}>
                 <span className="font-semibold text-sm tracking-tight">
                    {format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}
                 </span>
                 <span className="text-[10px] uppercase font-bold bg-white/20 px-2 py-0.5 rounded tracking-wider">
                    {isBlocked ? 'BLOQUÉ' : app.status}
                 </span>
             </div>

             <div className="p-4 space-y-4 bg-white">
                 <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-slate-100 shadow-sm">
                         {user?.photo_url ? (
                            <img src={user.photo_url} alt={app.user_name} className="h-full w-full object-cover" />
                         ) : (
                            <AvatarFallback className="bg-blue-50 text-blue-600 font-bold text-sm">
                                {getInitials(app.user_name)}
                            </AvatarFallback>
                         )}
                    </Avatar>
                    <div className="min-w-0">
                        <div className="font-bold text-slate-900 leading-tight truncate">
                            {isBlocked ? 'Non disponible' : app.user_name}
                        </div>
                        {!isBlocked && (
                            <div className="text-xs text-slate-500 truncate font-medium mt-0.5">
                                {app.user_email || 'Pas d\'email'}
                            </div>
                        )}
                    </div>
                 </div>
                 
                 <Separator />

                 <div className="flex justify-between items-start">
                     <div className="space-y-1">
                        <div className="font-bold text-sm text-slate-900 leading-tight">
                            {app.service_name}
                        </div>
                        <div className="text-xs text-slate-500 font-medium">
                            {app.duration} min
                        </div>
                     </div>
                     {!isBlocked && (
                         <div className="font-bold text-slate-900 text-sm">
                            {price} €
                         </div>
                     )}
                 </div>
             </div>
        </div>
    );
}