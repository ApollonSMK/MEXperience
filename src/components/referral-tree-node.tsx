import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { User, ChevronRight, ChevronDown } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

type TreeNodeProps = {
    node: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
        level: number;
        status: string;
        joinedAt: string;
        children: any[];
    };
};

export function ReferralTreeNode({ node }: TreeNodeProps) {
    const [isOpen, setIsOpen] = useState(false);
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div className="ml-6 border-l border-dashed border-gray-300 dark:border-gray-700 pl-6 py-2">
            <div className="flex items-center gap-3">
                {hasChildren && (
                    <button 
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                    >
                        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                )}
                {!hasChildren && <div className="w-6" />} {/* Spacer */}

                <Card className="flex items-center gap-4 p-3 min-w-[300px] hover:shadow-md transition-shadow">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={node.avatar} />
                        <AvatarFallback><User size={16} /></AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium leading-none">{node.name}</p>
                            <Badge variant={node.status === 'Ativo' ? 'default' : 'secondary'} className="text-[10px] h-5">
                                {node.status}
                            </Badge>
                        </div>
                        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                            <span>Nível {node.level}</span>
                            <span>{format(new Date(node.joinedAt), "d MMM yyyy", { locale: pt })}</span>
                        </div>
                    </div>
                </Card>
            </div>

            {isOpen && hasChildren && (
                <div className="mt-2 animate-in slide-in-from-top-2 fade-in duration-200">
                    {node.children.map((child) => (
                        <ReferralTreeNode key={child.id} node={child} />
                    ))}
                </div>
            )}
        </div>
    );
}