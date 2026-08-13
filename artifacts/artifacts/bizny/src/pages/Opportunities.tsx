import { useState } from "react";
import { 
  useListOpportunities, 
  getListOpportunitiesQueryKey,
  useCreateOpportunity,
  Opportunity,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Search, Filter, Briefcase, MapPin, Building, Calendar, DollarSign } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const opportunitySchema = z.object({
  title: z.string().min(3),
  type: z.string().min(1),
  industry: z.string().min(1),
  country: z.string().min(1),
  description: z.string().min(10),
  role: z.string().optional(),
  investmentSize: z.string().optional(),
  deadline: z.string().optional(),
});

export default function Opportunities() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: opportunities, isLoading } = useListOpportunities(
    typeFilter !== "all" ? { type: typeFilter } : undefined,
    {
      query: {
        queryKey: getListOpportunitiesQueryKey(typeFilter !== "all" ? { type: typeFilter } : undefined)
      }
    }
  );

  const createMutation = useCreateOpportunity();

  const form = useForm<z.infer<typeof opportunitySchema>>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: {
      title: "", type: "", industry: "", country: "", description: "", role: "", investmentSize: "", deadline: ""
    }
  });

  const onSubmit = (values: z.infer<typeof opportunitySchema>) => {
    createMutation.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListOpportunitiesQueryKey() });
        setIsCreateOpen(false);
        form.reset();
        toast({ description: "Opportunity posted successfully." });
      },
      onError: () => toast({ variant: "destructive", description: "Failed to post opportunity." })
    });
  };

  const filteredOpportunities = opportunities?.filter(opp => 
    opp.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    opp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opp.industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const OpportunityCard = ({ opp }: { opp: Opportunity }) => (
    <Card className="flex flex-col h-full hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 capitalize">
            {opp.type}
          </Badge>
          <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(opp.createdAt))} ago</span>
        </div>
        <CardTitle className="text-xl leading-tight line-clamp-2">{opp.title}</CardTitle>
        <CardDescription className="flex items-center gap-4 mt-2">
          <span className="flex items-center gap-1"><Building className="h-3.5 w-3.5" /> {opp.industry}</span>
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {opp.country}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <p className="text-muted-foreground text-sm line-clamp-3 mb-4">{opp.description}</p>
        <div className="space-y-2 text-sm">
          {opp.role && <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary" /> <span className="font-medium">Role:</span> {opp.role}</div>}
          {opp.investmentSize && <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" /> <span className="font-medium">Investment:</span> {opp.investmentSize}</div>}
          {opp.deadline && <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> <span className="font-medium">Deadline:</span> {opp.deadline}</div>}
        </div>
      </CardContent>
      <CardFooter className="pt-0 mt-auto border-t border-border/50 bg-muted/10 p-4">
        <div className="flex items-center gap-2 w-full">
          {opp.postedBy && (
            <div className="flex items-center gap-2 flex-1">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary overflow-hidden">
                {opp.postedBy.avatarUrl ? <img src={opp.postedBy.avatarUrl} className="w-full h-full object-cover" /> : opp.postedBy.name.charAt(0)}
              </div>
              <span className="text-xs font-medium truncate">{opp.postedBy.name}</span>
            </div>
          )}
          <Button size="sm" variant="secondary">View Details</Button>
        </div>
      </CardFooter>
    </Card>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Opportunities</h1>
          <p className="text-muted-foreground mt-1">Discover funding, jobs, projects, and partnerships.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Post Opportunity</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Post an Opportunity</DialogTitle>
              <DialogDescription>Share an opportunity with the Bizny network.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="E.g. Seeking Agritech Co-founder" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="funding">Funding</SelectItem><SelectItem value="job">Job</SelectItem><SelectItem value="project">Project</SelectItem><SelectItem value="partnership">Partnership</SelectItem><SelectItem value="training">Training</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="industry" render={({ field }) => (
                    <FormItem><FormLabel>Industry</FormLabel><FormControl><Input placeholder="E.g. Agriculture" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="country" render={({ field }) => (
                    <FormItem><FormLabel>Country</FormLabel><FormControl><Input placeholder="E.g. Kenya" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="deadline" render={({ field }) => (
                    <FormItem><FormLabel>Deadline (Optional)</FormLabel><FormControl><Input placeholder="YYYY-MM-DD" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="Detailed description..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="role" render={({ field }) => (
                    <FormItem><FormLabel>Role Needed (Optional)</FormLabel><FormControl><Input placeholder="E.g. Lead Engineer" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="investmentSize" render={({ field }) => (
                    <FormItem><FormLabel>Investment Size (Optional)</FormLabel><FormControl><Input placeholder="E.g. $10k - $50k" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Post Opportunity
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card/50">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search opportunities..." 
              className="pl-9 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px] bg-background">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="funding">Funding</SelectItem>
                <SelectItem value="job">Job</SelectItem>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="partnership">Partnership</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i} className="h-[280px]">
              <CardHeader><Skeleton className="h-6 w-3/4 mb-2" /><Skeleton className="h-4 w-1/2" /></CardHeader>
              <CardContent><Skeleton className="h-20 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      ) : filteredOpportunities?.length === 0 ? (
        <div className="text-center py-24 border border-dashed rounded-lg bg-card/50">
          <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium">No opportunities found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOpportunities?.map(opp => <OpportunityCard key={opp.id} opp={opp} />)}
        </div>
      )}
    </div>
  );
}
