import { useState } from "react";
import { 
  useListListings, 
  getListListingsQueryKey,
  useCreateListing,
  Listing
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Search, MapPin, Building, Phone, Mail, CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const listingSchema = z.object({
  businessName: z.string().min(2),
  product: z.string().min(2),
  description: z.string().min(10),
  location: z.string().min(2),
  country: z.string().min(2),
  industry: z.string().min(2),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().optional(),
});

export default function Marketplace() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: listings, isLoading } = useListListings(undefined, {
    query: {
      queryKey: getListListingsQueryKey()
    }
  });

  const createMutation = useCreateListing();

  const form = useForm<z.infer<typeof listingSchema>>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      businessName: "", product: "", description: "", location: "", country: "", industry: "", phone: "", whatsapp: "", email: ""
    }
  });

  const onSubmit = (values: z.infer<typeof listingSchema>) => {
    createMutation.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListListingsQueryKey() });
        setIsCreateOpen(false);
        form.reset();
        toast({ description: "Business listed successfully." });
      },
      onError: () => toast({ variant: "destructive", description: "Failed to list business." })
    });
  };

  const filteredListings = listings?.filter(l => 
    l.businessName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ListingCard = ({ listing }: { listing: Listing }) => (
    <Card className="flex flex-col h-full hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
        <div className="flex justify-between items-start mb-2">
          <Badge variant="outline" className="bg-background">
            {listing.industry}
          </Badge>
          {listing.isVerified && (
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
            </Badge>
          )}
        </div>
        <CardTitle className="text-xl">{listing.businessName}</CardTitle>
        <CardDescription className="text-foreground font-medium mt-1">{listing.product}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pt-4">
        <p className="text-muted-foreground text-sm line-clamp-3 mb-6">{listing.description}</p>
        
        <div className="space-y-3 mt-auto">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            <span>{listing.location}, {listing.country}</span>
          </div>
          
          <div className="pt-3 border-t border-border/50 flex flex-wrap gap-2">
            {listing.phone && (
              <a href={`tel:${listing.phone}`} className="inline-flex items-center justify-center h-8 px-3 rounded-md bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80">
                <Phone className="w-3 h-3 mr-1.5" /> Call
              </a>
            )}
            {listing.whatsapp && (
              <a href={`https://wa.me/${listing.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center h-8 px-3 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-medium hover:bg-emerald-500/20">
                WhatsApp
              </a>
            )}
            {listing.email && (
              <a href={`mailto:${listing.email}`} className="inline-flex items-center justify-center h-8 px-3 rounded-md bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80">
                <Mail className="w-3 h-3 mr-1.5" /> Email
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Marketplace</h1>
          <p className="text-muted-foreground mt-1">Discover verified businesses and products across the network.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> List Business</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>List Your Business</DialogTitle>
              <DialogDescription>Add your business to the discovery directory.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="businessName" render={({ field }) => (
                    <FormItem><FormLabel>Business Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="industry" render={({ field }) => (
                    <FormItem><FormLabel>Industry</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="product" render={({ field }) => (
                  <FormItem><FormLabel>Core Product/Service</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="location" render={({ field }) => (
                    <FormItem><FormLabel>City/Region</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="country" render={({ field }) => (
                    <FormItem><FormLabel>Country</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="whatsapp" render={({ field }) => (
                    <FormItem><FormLabel>WhatsApp</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Listing
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card/50">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by business name, product, or industry..." 
              className="pl-9 bg-background max-w-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i} className="h-[250px]"><CardContent className="p-6"><Skeleton className="h-6 w-3/4 mb-4" /><Skeleton className="h-20 w-full mb-4" /><Skeleton className="h-8 w-1/2" /></CardContent></Card>
          ))}
        </div>
      ) : filteredListings?.length === 0 ? (
        <div className="text-center py-24 border border-dashed rounded-lg bg-card/50">
          <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium">No businesses found</h3>
          <p className="text-muted-foreground">Try a different search term.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings?.map(listing => <ListingCard key={listing.id} listing={listing} />)}
        </div>
      )}
    </div>
  );
}
