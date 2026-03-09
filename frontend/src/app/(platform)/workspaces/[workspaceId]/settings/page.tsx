'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap, Check, Upload, Link2, Users, Bell, Blocks, CreditCard, Settings, MoreHorizontal } from 'lucide-react';
import { useProModal } from '@/hooks/use-pro-modal';

export default function WorkspaceSettingsPage() {
  const onOpen = useProModal((state) => state.onOpen);
  const isPro = false; // Mock billing state

  // Mock users
  const mockMembers = [
    { id: '1', name: 'Nguyễn Văn A', email: 'a.nguyen@example.com', role: 'Admin', avatar: 'https://i.pravatar.cc/150?u=1' },
    { id: '2', name: 'Trần Thị B', email: 'b.tran@example.com', role: 'Member', avatar: 'https://i.pravatar.cc/150?u=2' },
    { id: '3', name: 'Lê Văn C', email: 'c.le@example.com', role: 'Member', avatar: 'https://i.pravatar.cc/150?u=3' },
  ];

  return (
    <div className="mx-auto mt-8 max-w-6xl space-y-8 pb-16">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Workspace Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your workspace preferences, members, and billing details.
        </p>
      </div>

      <Tabs defaultValue="general" orientation="vertical" className="flex flex-col md:flex-row gap-8 w-full">
        {/* Sidebar Nav (Vertical Tabs) */}
        <TabsList className="md:w-64 flex flex-row md:flex-col justify-start bg-transparent h-auto p-0 space-y-1 space-x-2 md:space-x-0 overflow-x-auto md:overflow-visible shrink-0 pb-2 md:pb-0">
          <TabsTrigger 
            value="general" 
            className="w-full justify-start gap-2 px-4 py-2 text-muted-foreground data-[state=active]:bg-muted/60 data-[state=active]:text-foreground data-[state=active]:shadow-none hover:bg-muted/40 hover:text-foreground rounded-md transition-colors"
          >
            <Settings className="w-4 h-4 shrink-0" /> General
          </TabsTrigger>
          <TabsTrigger 
            value="members" 
            className="w-full justify-start gap-2 px-4 py-2 text-muted-foreground data-[state=active]:bg-muted/60 data-[state=active]:text-foreground data-[state=active]:shadow-none hover:bg-muted/40 hover:text-foreground rounded-md transition-colors"
          >
            <Users className="w-4 h-4 shrink-0" /> Members
          </TabsTrigger>
          <TabsTrigger 
            value="notifications" 
            className="w-full justify-start gap-2 px-4 py-2 text-muted-foreground data-[state=active]:bg-muted/60 data-[state=active]:text-foreground data-[state=active]:shadow-none hover:bg-muted/40 hover:text-foreground rounded-md transition-colors"
          >
            <Bell className="w-4 h-4 shrink-0" /> Notifications
          </TabsTrigger>
          <TabsTrigger 
            value="integrations" 
            className="w-full justify-start gap-2 px-4 py-2 text-muted-foreground data-[state=active]:bg-muted/60 data-[state=active]:text-foreground data-[state=active]:shadow-none hover:bg-muted/40 hover:text-foreground rounded-md transition-colors"
          >
            <Blocks className="w-4 h-4 shrink-0" /> Integrations
          </TabsTrigger>
          <TabsTrigger 
            value="billing" 
            className="w-full justify-start gap-2 px-4 py-2 text-muted-foreground data-[state=active]:bg-muted/60 data-[state=active]:text-foreground data-[state=active]:shadow-none hover:bg-muted/40 hover:text-foreground rounded-md transition-colors"
          >
            <CreditCard className="w-4 h-4 shrink-0" /> Billing
          </TabsTrigger>
        </TabsList>

        {/* Content Area */}
        <div className="flex-1 w-full max-w-3xl">

          {/* ── GENERAL TAB ── */}
          <TabsContent value="general" className="mt-0 space-y-6 focus-visible:outline-none focus-visible:ring-0">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Workspace Info</CardTitle>
                <CardDescription>
                  Update your workspace details and branding.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  <div className="h-20 w-20 rounded-md bg-muted flex border-2 border-dashed items-center justify-center text-muted-foreground cursor-pointer hover:bg-accent transition-colors shrink-0">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Workspace Logo</h4>
                    <p className="text-sm text-muted-foreground mb-3">Recommended size: 256x256px (PNG, JPG).</p>
                    <Button variant="outline" size="sm">Upload new image</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Workspace Name</Label>
                  <Input id="name" defaultValue="Kanban Board" placeholder="Enter workspace name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Workspace URL (Slug)</Label>
                  <div className="flex items-center">
                    <span className="bg-muted px-3 py-2 text-sm text-muted-foreground border border-r-0 rounded-l-md truncate">kanban.com/</span>
                    <Input id="slug" defaultValue="kanban-board" placeholder="workspace-slug" className="rounded-l-none" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/20 border-t py-4">
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>

            <Card className="border-destructive/30 shadow-sm">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible actions for this workspace. Proceed with caution.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-destructive/20 p-4 bg-destructive/5">
                  <div>
                    <h4 className="font-medium text-sm">Delete Workspace</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Permanently remove your workspace and all its data. This action is not reversible.
                    </p>
                  </div>
                  <Button variant="destructive" className="shrink-0 w-full sm:w-auto">Delete Workspace</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── MEMBERS TAB ── */}
          <TabsContent value="members" className="mt-0 space-y-6 focus-visible:outline-none focus-visible:ring-0">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0 pb-6">
                <div className="space-y-1">
                  <CardTitle>Members</CardTitle>
                  <CardDescription>
                    Manage who has access to this workspace.
                  </CardDescription>
                </div>
                <Button className="gap-2 w-full sm:w-auto">
                  <Users className="w-4 h-4" />
                  Invite User
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border bg-card">
                  {mockMembers.map((member, i) => (
                    <div key={member.id} className={`flex items-center justify-between p-4 ${i !== mockMembers.length - 1 ? 'border-b' : ''}`}>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <p className="text-sm font-medium leading-none mb-1">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select defaultValue={member.role.toLowerCase()}>
                          <SelectTrigger className="w-[110px] h-8 text-xs hidden sm:flex">
                            <SelectValue placeholder="Role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="guest">Guest</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── NOTIFICATIONS TAB ── */}
          <TabsContent value="notifications" className="mt-0 space-y-6 focus-visible:outline-none focus-visible:ring-0">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Configure how you receive alerts and summaries.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">Email Preferences</h4>
                  
                  <div className="flex items-center justify-between space-x-2 rounded-lg border p-4 shadow-sm bg-card">
                    <div className="flex flex-col space-y-1">
                      <Label htmlFor="due-date" className="font-medium">Due Date Reminders</Label>
                      <span className="text-sm text-muted-foreground">Email me when a card is due soon (24h).</span>
                    </div>
                    <Switch id="due-date" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between space-x-2 rounded-lg border p-4 shadow-sm bg-card">
                    <div className="flex flex-col space-y-1">
                      <Label htmlFor="mentions" className="font-medium">Mentions</Label>
                      <span className="text-sm text-muted-foreground">Email me when someone mentions me in a comment.</span>
                    </div>
                    <Switch id="mentions" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between space-x-2 rounded-lg border p-4 shadow-sm bg-card">
                    <div className="flex flex-col space-y-1">
                      <Label htmlFor="digest" className="font-medium">Weekly Digest</Label>
                      <span className="text-sm text-muted-foreground">Receive a weekly summary of workspace activity.</span>
                    </div>
                    <Switch id="digest" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── INTEGRATIONS TAB ── */}
          <TabsContent value="integrations" className="mt-0 space-y-6 focus-visible:outline-none focus-visible:ring-0">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Integrations</CardTitle>
                <CardDescription>
                  Connect your workspace with third-party tools via Webhooks.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Slack/Discord Mockup */}
                <div className="flex flex-col gap-4 rounded-lg border p-6 shadow-sm relative overflow-hidden bg-card">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <Blocks className="h-24 w-24" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600">
                      <Link2 className="h-6 w-6" />
                    </div>
                    <div className="z-10">
                      <h4 className="text-lg font-semibold">Custom Webhooks</h4>
                      <p className="text-sm text-muted-foreground">Send card updates directly to Discord or Slack channels.</p>
                    </div>
                  </div>
                  
                  <div className="pt-2 space-y-3 z-10 w-full max-w-md">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Endpoint URL</Label>
                      <Input placeholder="https://discord.com/api/webhooks/..." className="bg-background" />
                    </div>
                    <Button variant="secondary" className="w-fit">Add Webhook</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── BILLING TAB ── */}
          <TabsContent value="billing" className="mt-0 space-y-6 focus-visible:outline-none focus-visible:ring-0">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Billing & Subscription</CardTitle>
                <CardDescription>
                  Manage your billing details and upgrade your plan.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Current Plan Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border bg-card p-6 shadow-sm">
                  <div className="space-y-1">
                    <p className="text-lg font-semibold leading-none">Free Plan</p>
                    <p className="text-sm text-muted-foreground pt-1">Basic project management for individuals and small teams.</p>
                  </div>
                  <div className="flex justify-end">
                    <Badge variant="secondary" className="font-semibold uppercase tracking-wider text-muted-foreground h-7 px-3">Current Plan</Badge>
                  </div>
                </div>

                {!isPro && (
                  <div className="pt-2">
                    {/* Upgrade Pitch Card */}
                    <div className="relative rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/50 p-6 sm:p-8 shadow-sm overflow-hidden">
                      <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 opacity-5 pointer-events-none">
                        <Zap className="h-64 w-64 text-amber-500 fill-amber-500" />
                      </div>
                      
                      <div className="relative z-10">
                        <div className="mb-6 flex items-center justify-between">
                          <div>
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 mb-3">
                              <Zap className="h-3.5 w-3.5" /> PRO
                            </div>
                            <h3 className="text-2xl font-bold text-amber-950">Unlock your team&apos;s full potential</h3>
                            <p className="text-amber-800/80 mt-1">Get advanced features for productivity and control.</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                          <ul className="space-y-4 text-sm text-amber-900/90">
                            <li className="flex items-center gap-x-3">
                              <div className="bg-amber-100 rounded-full p-1"><Check className="h-3 w-3 text-amber-600" /></div>
                              <span className="font-medium">Unlimited boards</span> and lists
                            </li>
                            <li className="flex items-center gap-x-3">
                              <div className="bg-amber-100 rounded-full p-1"><Check className="h-3 w-3 text-amber-600" /></div>
                              <span className="font-medium">Advanced checklists</span> and dates
                            </li>
                          </ul>
                          <ul className="space-y-4 text-sm text-amber-900/90">
                            <li className="flex items-center gap-x-3">
                              <div className="bg-amber-100 rounded-full p-1"><Check className="h-3 w-3 text-amber-600" /></div>
                              <span className="font-medium">Larger file attachments</span> (250MB)
                            </li>
                            <li className="flex items-center gap-x-3">
                              <div className="bg-amber-100 rounded-full p-1"><Check className="h-3 w-3 text-amber-600" /></div>
                              <span className="font-medium">Premium priority support</span>
                            </li>
                          </ul>
                        </div>

                        <Button 
                          onClick={onOpen}
                          size="lg"
                          className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 font-semibold text-white shadow-md focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 border-0"
                        >
                          Upgrade for $9/mo
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </div>
      </Tabs>
    </div>
  );
}
