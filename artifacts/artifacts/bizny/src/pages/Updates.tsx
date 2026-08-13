import { 
  useListUpdates, 
  getListUpdatesQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Target, TrendingUp, BookOpen, Newspaper, Users, Activity } from "lucide-react";

export default function Updates() {
  const { data: updates, isLoading } = useListUpdates({
    query: {
      queryKey: getListUpdatesQueryKey()
    }
  });

  const getUpdateIcon = (type: string) => {
    switch(type) {
      case 'milestone': return <Target className="h-5 w-5 text-emerald-500" />;
      case 'progress': return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case 'template': return <BookOpen className="h-5 w-5 text-purple-500" />;
      case 'industry_news': return <Newspaper className="h-5 w-5 text-amber-500" />;
      case 'community': return <Users className="h-5 w-5 text-primary" />;
      default: return <Activity className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight">Platform Updates</h1>
        <p className="text-muted-foreground mt-1">Network-wide milestones, industry news, and community highlights.</p>
      </div>

      <div className="max-w-4xl">
        {isLoading ? (
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <Card key={i}><CardContent className="p-5 flex gap-4"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-2 flex-1"><Skeleton className="h-5 w-1/3" /><Skeleton className="h-4 w-full" /></div></CardContent></Card>
            ))}
          </div>
        ) : updates?.length === 0 ? (
          <div className="text-center py-24 border border-dashed rounded-lg bg-card/50">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No updates yet</h3>
            <p className="text-muted-foreground">The network is currently quiet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {updates?.map((update) => (
              <Card key={update.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-5 flex gap-4 items-start">
                  <div className="bg-muted p-3 rounded-full shrink-0">
                    {getUpdateIcon(update.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="font-semibold text-lg">{update.title}</h3>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(update.createdAt))} ago
                      </span>
                    </div>
                    
                    <p className="text-muted-foreground text-sm leading-relaxed">{update.content}</p>
                    
                    <div className="flex flex-wrap items-center gap-3 pt-3 mt-2 border-t border-border/50">
                      <Badge variant="outline" className="capitalize text-xs">{update.type.replace('_', ' ')}</Badge>
                      
                      {update.author && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                          By <span className="font-medium text-foreground">{update.author.name}</span>
                        </div>
                      )}
                      
                      {update.venture && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                          Venture: <span className="font-medium text-foreground">{update.venture}</span>
                        </div>
                      )}

                      {update.progressPercent !== undefined && update.progressPercent !== null && (
                        <div className="text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
                          {update.progressPercent}% Complete
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
