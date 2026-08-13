import { useState } from "react";
import { useParams } from "wouter";
import { 
  useGetVenture, 
  getGetVentureQueryKey,
  useGetVentureProgress,
  getGetVentureProgressQueryKey,
  useAddProgressEntry,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Calendar, Target, CheckCircle2, AlertCircle, FileText, Image as ImageIcon, Video, File, Mic, Radio } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { formatDistanceToNow } from "date-fns";

const progressSchema = z.object({
  dayNumber: z.coerce.number().min(1),
  content: z.string().min(10),
  contentType: z.enum(["text", "photo", "video", "document", "voice", "livestream"]),
  milestone: z.string().optional(),
  mediaUrl: z.string().optional(),
});

export default function VentureDetail() {
  const { id } = useParams();
  const ventureId = parseInt(id || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEntryOpen, setIsEntryOpen] = useState(false);

  const { data: venture, isLoading: ventureLoading } = useGetVenture(ventureId, {
    query: {
      enabled: !!ventureId,
      queryKey: getGetVentureQueryKey(ventureId)
    }
  });

  const { data: progressEntries, isLoading: progressLoading } = useGetVentureProgress(ventureId, {
    query: {
      enabled: !!ventureId,
      queryKey: getGetVentureProgressQueryKey(ventureId)
    }
  });

  const addProgressMutation = useAddProgressEntry();

  const form = useForm<z.infer<typeof progressSchema>>({
    resolver: zodResolver(progressSchema),
    defaultValues: {
      dayNumber: venture?.currentDay || 1,
      content: "",
      contentType: "text",
      milestone: "",
      mediaUrl: "",
    }
  });

  const onSubmit = (values: z.infer<typeof progressSchema>) => {
    addProgressMutation.mutate({ id: ventureId, data: { ...values, ventureId } as any }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetVentureProgressQueryKey(ventureId) });
        queryClient.invalidateQueries({ queryKey: getGetVentureQueryKey(ventureId) });
        setIsEntryOpen(false);
        form.reset({ ...form.getValues(), content: "", mediaUrl: "", milestone: "" });
        toast({ description: "Progress updated successfully." });
      },
      onError: () => toast({ variant: "destructive", description: "Failed to log progress." })
    });
  };

  const getContentTypeIcon = (type: string) => {
    switch(type) {
      case 'photo': return <ImageIcon className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'document': return <File className="w-4 h-4" />;
      case 'voice': return <Mic className="w-4 h-4" />;
      case 'livestream': return <Radio className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  if (ventureLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
        <Card><CardContent className="p-6"><Skeleton className="h-8 w-full" /></CardContent></Card>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!venture) {
    return (
      <div className="text-center py-24 border border-dashed rounded-lg bg-card/50">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium">Venture not found</h3>
        <p className="text-muted-foreground">The venture you are looking for does not exist.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className="bg-background">{venture.template?.industry || "Venture"}</Badge>
            <Badge variant={venture.status === 'active' ? 'default' : 'secondary'} className="capitalize">
              {venture.status}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold font-display tracking-tight">{venture.title}</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-4">
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Day {venture.currentDay} of {venture.template?.durationDays || "?"}</span>
            <span>Started {formatDistanceToNow(new Date(venture.startedAt))} ago</span>
          </p>
        </div>
        
        <Dialog open={isEntryOpen} onOpenChange={setIsEntryOpen}>
          <DialogTrigger asChild>
            <Button size="lg"><Plus className="h-4 w-4 mr-2" /> Post Today's Update</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Log Venture Progress</DialogTitle>
              <DialogDescription>Document your execution. Transparency builds trust.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="dayNumber" render={({ field }) => (
                    <FormItem><FormLabel>Day Number</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="contentType" render={({ field }) => (
                    <FormItem><FormLabel>Content Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl><SelectContent>
                      <SelectItem value="text">Text Update</SelectItem>
                      <SelectItem value="photo">Photo Evidence</SelectItem>
                      <SelectItem value="video">Video Walkthrough</SelectItem>
                      <SelectItem value="document">Document/Report</SelectItem>
                    </SelectContent></Select><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="content" render={({ field }) => (
                  <FormItem><FormLabel>Update Description</FormLabel><FormControl><Textarea className="h-24 resize-none" placeholder="What did you execute today?" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="milestone" render={({ field }) => (
                    <FormItem><FormLabel>Milestone Achieved (Optional)</FormLabel><FormControl><Input placeholder="E.g. Secured permits" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="mediaUrl" render={({ field }) => (
                    <FormItem><FormLabel>Media URL (Optional)</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={addProgressMutation.isPending}>
                    {addProgressMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Post Update
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card/50 border-primary/20">
        <CardContent className="p-6">
          <div className="flex justify-between items-end mb-2">
            <span className="font-medium text-sm text-muted-foreground">Execution Progress</span>
            <span className="font-display font-bold text-2xl text-primary">{venture.progressPercent}%</span>
          </div>
          <Progress value={venture.progressPercent} className="h-3 bg-muted" />
        </CardContent>
      </Card>

      <div className="mt-8 relative">
        <div className="absolute left-8 top-0 bottom-0 w-px bg-border z-0" />
        
        <div className="space-y-6 relative z-10">
          {progressLoading ? (
             <div className="pl-20 space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></div>
          ) : progressEntries?.length === 0 ? (
            <div className="pl-20 py-12">
              <div className="border border-dashed rounded-lg p-8 text-center bg-card/50">
                <Target className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground font-medium">No progress logged yet.</p>
                <p className="text-sm text-muted-foreground mt-1">Start executing your blueprint and log your first day.</p>
              </div>
            </div>
          ) : (
            progressEntries?.map((entry) => (
              <div key={entry.id} className="flex gap-6 items-start relative">
                <div className="w-16 flex-shrink-0 flex flex-col items-center pt-1">
                  <div className="w-10 h-10 rounded-full bg-card border-2 border-primary flex items-center justify-center font-bold text-sm text-primary shadow-sm z-10">
                    D{entry.dayNumber}
                  </div>
                </div>
                <Card className="flex-1 hover:border-border transition-colors shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {getContentTypeIcon(entry.contentType)}
                        <span className="capitalize">{entry.contentType} update</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(entry.createdAt))} ago</span>
                      </div>
                      {entry.milestone && (
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Milestone: {entry.milestone}
                        </Badge>
                      )}
                    </div>
                    <p className="text-foreground whitespace-pre-wrap leading-relaxed">{entry.content}</p>
                    
                    {entry.mediaUrl && (
                      <div className="mt-4 rounded-md overflow-hidden border border-border/50 max-w-2xl bg-muted/30">
                        {entry.contentType === 'video' ? (
                          <div className="aspect-video flex items-center justify-center text-muted-foreground">
                             <Video className="w-8 h-8 opacity-20" />
                             <span className="ml-2 text-sm">Video content preview</span>
                          </div>
                        ) : (
                          <img src={entry.mediaUrl} alt="Progress update media" className="w-full h-auto object-cover max-h-96" onError={(e) => (e.currentTarget.style.display = 'none')} />
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
