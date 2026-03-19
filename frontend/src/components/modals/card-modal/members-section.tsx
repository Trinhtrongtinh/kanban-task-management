// src/components/modals/card-modal/members-section.tsx

"use client";

import { Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/types";
import { MemberPicker } from "./member-picker";
import { resolveAvatarUrl } from "@/lib/utils";
import { useI18n } from '@/hooks/ui/use-i18n';

interface MembersSectionProps {
    card: Card;
}

export const MembersSection = ({ card }: MembersSectionProps) => {
    const { t } = useI18n();
    return (
        <div className="space-y-2">
            <h3 className="text-xs font-semibold text-neutral-700">{t('cardModal.members.title')}</h3>
            <div className="flex flex-row flex-wrap items-center gap-1">
                {card.members.map((member) => (
                    <Avatar key={member.id} className="h-8 w-8">
                        <AvatarImage src={resolveAvatarUrl(member.avatarUrl)} alt={member.username || member.name || ''} />
                        <AvatarFallback className="text-xs">
                            {(member.username || member.name || 'U').substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                ))}

                <MemberPicker card={card}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-neutral-200 hover:bg-neutral-300 transition"
                    >
                        <Plus className="h-4 w-4 text-neutral-600" />
                        <span className="sr-only">{t('cardModal.members.addMember')}</span>
                    </Button>
                </MemberPicker>
            </div>
        </div>
    );
};
