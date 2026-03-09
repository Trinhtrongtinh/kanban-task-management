'use client';

import { useState } from 'react';
import { useProModal } from '@/hooks/use-pro-modal';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Loader2 } from 'lucide-react';

export function ProModal() {
  const { isOpen, onClose } = useProModal();
  const [isLoading, setIsLoading] = useState(false);

  const onUpgrade = () => {
    setIsLoading(true);
    // Simulate Stripe redirect delay
    setTimeout(() => {
      setIsLoading(false);
      onClose(); // In a real app, this redirects to Stripe. We'll close just for mock flow.
    }, 1500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden border-0 bg-transparent shadow-none">
        <div className="bg-white rounded-xl overflow-hidden text-center p-6 space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Upgrade to Kanban Pro</h2>
            <p className="text-muted-foreground">Unlock powerful features to manage your projects better.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {/* Free Plan */}
            <Card className="border-border/50 shadow-sm flex flex-col justify-between">
              <div>
                <CardHeader>
                  <CardTitle className="text-xl">Free</CardTitle>
                  <CardDescription>For individuals getting started</CardDescription>
                  <div className="mt-4 font-bold text-4xl">$0<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-x-2"><Check className="h-4 w-4 text-primary" /> Up to 3 boards</li>
                    <li className="flex items-center gap-x-2"><Check className="h-4 w-4 text-primary" /> Basic lists & cards</li>
                    <li className="flex items-center gap-x-2"><Check className="h-4 w-4 text-primary" /> Community support</li>
                  </ul>
                </CardContent>
              </div>
              <CardFooter>
                <Button className="w-full" variant="outline" disabled>Current Plan</Button>
              </CardFooter>
            </Card>

            {/* Pro Plan */}
            <Card className="border-primary shadow-lg ring-2 ring-primary/20 flex flex-col justify-between relative">
              <div className="absolute top-0 right-6 translate-y-[-50%] bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                RECOMMENDED
              </div>
              <div>
                <CardHeader>
                  <CardTitle className="text-xl">Pro</CardTitle>
                  <CardDescription>For power users and teams</CardDescription>
                  <div className="mt-4 font-bold text-4xl">$9<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-x-2"><Check className="h-4 w-4 text-primary" /> Unlimited boards</li>
                    <li className="flex items-center gap-x-2"><Check className="h-4 w-4 text-primary" /> Advanced checklists</li>
                    <li className="flex items-center gap-x-2"><Check className="h-4 w-4 text-primary" /> Admin & security features</li>
                    <li className="flex items-center gap-x-2"><Check className="h-4 w-4 text-primary" /> Priority 24/7 support</li>
                  </ul>
                </CardContent>
              </div>
              <CardFooter>
                <Button className="w-full" onClick={onUpgrade} disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Upgrade Now
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
