import { useState } from "react";
import {
  useListListings,
  getListListingsQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Search, MapPin, Phone, MessageCircle, Mail,
  CheckCircle2, Filter, Users, Building, Factory,
  Globe, Landmark, Truck, FlaskConical, ChevronRight,
  User, Award, ShieldCheck,
} from "lucide-react";

const DIRECTORY_TYPES = [
  { id: "all", label: "All", icon: Users },
  { id: "businesses", label: "Businesses", icon: Building },
  { id: "manufacturers", label: "Manufacturers", icon: Factory },
  { id: "suppliers", label: "Suppliers", icon: Truck },
  { id: "exporters", label: "Exporters", icon: Globe },
  { id: "processors", label: "Processors", icon: FlaskConical },
  { id: "investors", label: "Investors", icon: Landmark },
  { id: "researchers", label: "Researchers", icon: FlaskConical },
  { id: "field-agents", label: "Field Agents", icon: Award },
];

const MOCK_PEOPLE = [
  {
    id: 1,
    name: "Amara Okafor",
    type: "Manufacturer",
    industry: "Food Processing",
    location: "Lagos, Nigeria",
    products: ["Tomato Paste", "Palm Oil"],
    verified: true,
    phone: "+234 801 234 5678",
    whatsapp: "+234 801 234 5678",
  },
  {
    id: 2,
    name: "Nzinga Dlamini Exports Ltd",
    type: "Exporter",
    industry: "Agriculture",
    location: "Johannesburg, South Africa",
    products: ["Macadamia Nuts", "Rooibos Tea"],
    verified: true,
    phone: "+27 11 234 5678",
    whatsapp: "+27 11 234 5678",
  },
  {
    id: 3,
    name: "Kofi Mensah",
    type: "Supplier",
    industry: "Construction",
    location: "Accra, Ghana",
    products: ["Steel Rods", "Cement", "Roofing Sheets"],
    verified: false,
    phone: "+233 20 123 4567",
    whatsapp: null,
  },
  {
    id: 4,
    name: "FreshCold Logistics",
    type: "Processor",
    industry: "Cold Chain",
    location: "Nairobi, Kenya",
    products: ["Cold Storage", "Refrigerated Transport"],
    verified: true,
    phone: "+254 700 123 456",
    whatsapp: "+254 700 123 456",
  },
  {
    id: 5,
    name: "Dr. Fatima Al-Hassan",
    type: "Researcher",
    industry: "Agriculture & Soil Science",
    location: "Khartoum, Sudan",
    products: ["Soil Analysis", "Crop Advisory"],
    verified: true,
    phone: null,
    whatsapp: null,
  },
  {
    id: 6,
    name: "Ibrahim Touré",
    type: "Field Agent",
    industry: "Industrial Verification",
    location: "Abidjan, Côte d'Ivoire",
    products: ["Business Verification", "Factory Audit"],
    verified: true,
    phone: "+225 07 123 4567",
    whatsapp: "+225 07 123 4567",
  },
];

function DirectoryCard({ person }: { person: typeof MOCK_PEOPLE[0] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-all">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/10 to-teal-50 flex items-center justify-center shrink-0 border border-primary/10">
          <span className="font-display font-bold text-primary text-base">
            {person.name.charAt(0)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-semibold text-sm text-gray-900 leading-snug">{person.name}</h3>
            {person.verified && (
              <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-gray-50 text-gray-600 border-gray-200">
              {person.type}
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Building className="h-3 w-3 text-gray-400" />
          {person.industry}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <MapPin className="h-3 w-3 text-gray-400" />
          {person.location}
        </div>
      </div>

      {person.products.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {person.products.slice(0, 3).map((p, i) => (
            <span key={i} className="text-[10px] bg-gray-50 text-gray-600 border border-gray-100 px-2 py-0.5 rounded-full">
              {p}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-2 border-t border-gray-50">
        {person.whatsapp && (
          <a
            href={`https://wa.me/${person.whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100 transition-colors"
          >
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
          </a>
        )}
        {person.phone && (
          <a
            href={`tel:${person.phone}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-50 text-gray-700 text-xs font-semibold hover:bg-gray-100 transition-colors border border-gray-100"
          >
            <Phone className="h-3.5 w-3.5" /> Call
          </a>
        )}
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary/5 text-primary text-xs font-semibold hover:bg-primary/10 transition-colors">
          <User className="h-3.5 w-3.5" /> Profile
        </button>
      </div>
    </div>
  );
}

export default function Directory() {
  const [activeType, setActiveType] = useState("all");
  const [search, setSearch] = useState("");

  const { data: listings } = useListListings(undefined, {
    query: { queryKey: getListListingsQueryKey() },
  });

  const filtered = MOCK_PEOPLE.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.industry.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeType !== "all" && p.type.toLowerCase() !== activeType.toLowerCase() && p.type.toLowerCase() + "s" !== activeType) return false;
    return true;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div>
        <h1 className="font-display font-bold text-2xl text-gray-900 tracking-tight">Directory</h1>
        <p className="text-sm text-gray-500 mt-1">Find verified economic actors across Africa</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, industry, product, location…"
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
        />
      </div>

      {/* Type filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        {DIRECTORY_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => setActiveType(type.id)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              activeType === type.id
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Verified", value: "1,240+", color: "text-emerald-600" },
          { label: "Countries", value: "28", color: "text-blue-600" },
          { label: "Industries", value: "45+", color: "text-primary" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
            <p className={`font-display font-bold text-lg ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Results */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-700">{filtered.length} results</p>
          <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-medium">
            <Filter className="h-3.5 w-3.5" /> Filter
          </button>
        </div>
        <div className="space-y-3">
          {filtered.map((person) => (
            <DirectoryCard key={person.id} person={person} />
          ))}
        </div>
      </div>

      {/* Marketplace listings from API */}
      {listings && listings.length > 0 && (
        <section>
          <h2 className="font-display font-bold text-base text-gray-900 mb-3">Business Listings</h2>
          <div className="space-y-2">
            {listings.slice(0, 5).map((listing) => (
              <div key={listing.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-sm text-gray-900">{listing.businessName}</h3>
                  {listing.isVerified && (
                    <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-2">{listing.product} · {listing.industry}</p>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <MapPin className="h-3 w-3" /> {listing.location}, {listing.country}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
