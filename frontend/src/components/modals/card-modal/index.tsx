'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCardModal } from '@/hooks/use-card-modal';
import { Users, Calendar, Paperclip } from 'lucide-react';

export function CardModal() {
  const { id, isOpen, onClose } = useCardModal();

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-4">
          <div className="space-y-4 md:col-span-3">
            <DialogHeader>
              <DialogTitle>{id ? `Card ${id}` : 'Card'}</DialogTitle>
              <DialogDescription>In list: To Do</DialogDescription>
            </DialogHeader>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Add a more detailed description..."
                className="mt-2 min-h-[120px]"
              />
            </div>
            <div>
              <h3 className="text-sm font-medium">Activity</h3>
              <p className="mt-2 text-sm text-muted-foreground">No activity yet.</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 md:col-span-1">
            <Button variant="secondary" className="w-full justify-start">
              <Users className="mr-2 h-4 w-4" />
              Members
            </Button>
            <Button variant="secondary" className="w-full justify-start">
              <Calendar className="mr-2 h-4 w-4" />
              Due Date
            </Button>
            <Button variant="secondary" className="w-full justify-start">
              <Paperclip className="mr-2 h-4 w-4" />
              Attachment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
