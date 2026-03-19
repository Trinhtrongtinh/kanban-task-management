// src/components/modals/card-modal/member-picker.tsx

"use client";

import { Check } from "lucide-react";
import { Card } from "@/types";
import { useAssignMember, useUnassignMember } from "@/api/card-members";
import { useGetBoardMembers } from "@/api/board-members";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveAvatarUrl } from "@/lib/utils";
import { useI18n } from '@/hooks/ui/use-i18n';

interface MemberPickerProps {
    card: Card;
    children: React.ReactNode;
}

export const MemberPicker = ({ card, children }: MemberPickerProps) => {
    const { t } = useI18n();
    const { data: boardMembers = [], isLoading } = useGetBoardMembers(card.boardId);
    const { mutate: assignMember } = useAssignMember(card.id, card.boardId);
    const { mutate: unassignMember } = useUnassignMember(card.id);

    const toggleMember = (userId: string) => {
        const isAssigned = card.members.some((member) => member.id === userId);
        if (isAssigned) {
            unassignMember({ cardId: card.id, userId });
        } else {
            assignMember({ cardId: card.id, userId });
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                {children}
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 p-0" side="bottom">
                <Command>
                    <CommandInput placeholder={t('cardModal.members.searchPlaceholder')} />
                    <CommandList>
                        <CommandEmpty>
                            {isLoading ? t('cardModal.members.loading') : t('cardModal.members.empty')}
                        </CommandEmpty>
                        <CommandGroup heading={t('cardModal.members.groupHeading')}>
                            {boardMembers.map((user) => {
                                const isAssigned = card.members.some((member) => member.id === user.id);

                                return (
                                    <CommandItem
                                        key={user.id}
                                        onSelect={() => toggleMember(user.id)}
                                        className="flex cursor-pointer items-center gap-2"
                                    >
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={resolveAvatarUrl(user.avatarUrl)} alt={user.username || user.name || ''} />
                                            <AvatarFallback className="text-[10px]">
                                                {(user.username || user.name || 'U').substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm">{user.username || user.name}</span>
                                        {isAssigned && <Check className="ml-auto h-4 w-4" />}
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};
