'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Bell, Megaphone, Send, User, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useListPushCampaignsQuery,
  useSendManualPushMutation,
  useSendPushCampaignMutation,
} from '@/integrations/hooks';
import { getAdminAppName } from '@/lib/admin-brand';

export default function SendPushNotificationPage() {
  const router = useRouter();
  const [sendPush, { isLoading }] = useSendManualPushMutation();
  const { data: campaigns = [], isLoading: campaignsLoading } = useListPushCampaignsQuery();
  const [sendCampaign, { isLoading: isSendingCampaign }] = useSendPushCampaignMutation();

  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [target, setTarget] = React.useState<'all' | 'specific'>('all');
  const [userId, setUserId] = React.useState('');
  const [selectedCampaignSlug, setSelectedCampaignSlug] = React.useState('');
  const selectedCampaign = campaigns.find((campaign) => campaign.slug === selectedCampaignSlug);

  React.useEffect(() => {
    if (!selectedCampaignSlug && campaigns.length > 0) {
      setSelectedCampaignSlug(campaigns[0].slug);
    }
  }, [campaigns, selectedCampaignSlug]);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Title and message are required.');
      return;
    }

    if (target === 'specific' && !userId.trim()) {
      toast.error('User ID is required for specific target.');
      return;
    }

    try {
      const res = await sendPush({
        title: title.trim(),
        body: body.trim(),
        target_all: target === 'all',
        user_id: target === 'specific' ? userId.trim() : undefined,
      }).unwrap();

      toast.success(res.sent_count 
        ? `${res.sent_count} notifications sent successfully.` 
        : 'Push notification sent successfully.'
      );
      router.back();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || 'Failed to send notification.');
    }
  };

  const handleSendCampaign = async () => {
    if (!selectedCampaignSlug) {
      toast.error('Please select a campaign.');
      return;
    }

    try {
      const res = await sendCampaign(selectedCampaignSlug).unwrap();
      toast.success(
        `${res.sent_count}/${res.target_count} campaign notifications sent. Failed: ${res.failed_count}.`,
      );
    } catch (err: any) {
      toast.error(err?.data?.error?.message || 'Failed to send campaign.');
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Send Push Notification</h1>
          <p className="text-sm text-muted-foreground">Send real-time mobile notifications to your users.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Megaphone className="size-4" />
            Push Campaign
          </CardTitle>
          <CardDescription>Send a preconfigured campaign to its saved audience segment.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="campaign">Campaign</Label>
            <Select
              value={selectedCampaignSlug}
              onValueChange={setSelectedCampaignSlug}
              disabled={campaignsLoading || campaigns.length === 0}
            >
              <SelectTrigger id="campaign">
                <SelectValue placeholder={campaignsLoading ? 'Loading campaigns...' : 'Select campaign'} />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.slug} value={campaign.slug} disabled={!campaign.is_active}>
                    {campaign.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCampaign ? (
            <div className="rounded-md border bg-muted/20 p-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{selectedCampaign.title}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {selectedCampaign.target_segment}
                </span>
                {selectedCampaign.deep_link ? (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {selectedCampaign.deep_link}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-muted-foreground">{selectedCampaign.body}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No active push campaigns found.</p>
          )}
        </CardContent>
        <CardFooter className="justify-end border-t pt-6">
          <Button
            onClick={handleSendCampaign}
            disabled={!selectedCampaignSlug || isSendingCampaign}
            className="bg-amethyst hover:bg-amethyst/90"
          >
            <Send className="mr-2 size-4" />
            {isSendingCampaign ? 'Sending...' : 'Send Campaign'}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notification Content</CardTitle>
          <CardDescription>This will be displayed as a push notification on the user's device.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input 
              id="title" 
              placeholder="e.g. Special Offer!" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="body">Message Body</Label>
            <Textarea 
              id="body" 
              placeholder="e.g. New courses are live — open the app for details." 
              className="min-h-[100px]"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          <div className="space-y-3 pt-4 border-t">
            <Label>Target Audience</Label>
            <RadioGroup value={target} onValueChange={(v) => setTarget(v as any)} className="grid grid-cols-2 gap-4">
              <div>
                <RadioGroupItem value="all" id="target-all" className="peer sr-only" />
                <Label
                  htmlFor="target-all"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-amethyst [&:has([data-state=checked])]:border-amethyst"
                >
                  <Users className="mb-3 size-6" />
                  All Users
                </Label>
              </div>
              <div>
                <RadioGroupItem value="specific" id="target-specific" className="peer sr-only" />
                <Label
                  htmlFor="target-specific"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-amethyst [&:has([data-state=checked])]:border-amethyst"
                >
                  <User className="mb-3 size-6" />
                  Specific User
                </Label>
              </div>
            </RadioGroup>
          </div>

          {target === 'specific' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label htmlFor="userId">User ID</Label>
              <Input 
                id="userId" 
                placeholder="Enter user UUID" 
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-end border-t pt-6">
          <Button variant="outline" onClick={() => router.back()} className="mr-2">Cancel</Button>
          <Button onClick={handleSend} disabled={isLoading} className="bg-amethyst hover:bg-amethyst/90">
            <Send className="mr-2 size-4" />
            {isLoading ? 'Sending...' : 'Send Notification'}
          </Button>
        </CardFooter>
      </Card>

      {/* Preview */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <Bell className="size-4" /> Device Preview
        </h3>
        <div className="mx-auto w-64 rounded-2xl bg-slate-100 p-3 dark:bg-slate-900 border-4 border-slate-200 dark:border-slate-800">
          <div className="mb-2 h-1 w-8 self-center rounded-full bg-slate-300 dark:bg-slate-700 mx-auto" />
          <div className="rounded-lg bg-white/80 dark:bg-black/50 p-3 shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-2 mb-1">
              <div className="size-4 rounded bg-amethyst" />
              <span className="text-[10px] font-bold truncate max-w-[140px]">
                {getAdminAppName().toUpperCase()}
              </span>
              <span className="ml-auto text-[8px] text-muted-foreground">now</span>
            </div>
            <p className="text-[11px] font-bold line-clamp-1">{title || 'Notification Title'}</p>
            <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">
              {body || 'Your notification message will appear here...'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
