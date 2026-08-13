export const AFRICAN_COUNTRIES = [
  "Algeria","Angola","Benin","Botswana","Burkina Faso","Burundi","Cabo Verde",
  "Cameroon","Central African Republic","Chad","Comoros","Congo (Brazzaville)",
  "Congo (DRC)","Djibouti","Egypt","Equatorial Guinea","Eritrea","Eswatini",
  "Ethiopia","Gabon","Gambia","Ghana","Guinea","Guinea-Bissau","Ivory Coast",
  "Kenya","Lesotho","Liberia","Libya","Madagascar","Malawi","Mali","Mauritania",
  "Mauritius","Morocco","Mozambique","Namibia","Niger","Nigeria","Rwanda",
  "São Tomé and Príncipe","Senegal","Seychelles","Sierra Leone","Somalia",
  "South Africa","South Sudan","Sudan","Tanzania","Togo","Tunisia","Uganda",
  "Zambia","Zimbabwe",
] as const;

export const DIASPORA_COUNTRIES = [
  "United Kingdom","United States","Canada","United Arab Emirates","France",
  "Germany","China","India","Brazil","Australia","Netherlands","Saudi Arabia",
  "Qatar","Kuwait","Turkey","Italy","Spain","Sweden","Belgium","Portugal",
] as const;

export const ALL_COUNTRIES: string[] = [...AFRICAN_COUNTRIES, ...DIASPORA_COUNTRIES];

export const INDUSTRY_SECTORS = [
  "Agriculture & Food","Energy & Power","Manufacturing","Construction & Infrastructure",
  "Mining & Extractives","Logistics & Transport","Technology & Digital","Healthcare",
  "Education","Creative Economy","Financial Services","Trade & Commerce",
  "Water & Sanitation","Environment & Recycling","Fisheries & Aquaculture",
  "Textiles & Apparel","Tourism & Hospitality","Other",
] as const;

export const SPECIFIC_ACTIVITIES: Record<string, string[]> = {
  "Agriculture & Food": [
    "Okra seed production","Pepper drying","Cassava starch processing",
    "Palm oil packaging","Catfish fingerling production","Poultry farming",
    "Rice milling","Tomato processing","Groundnut oil extraction",
    "Mushroom cultivation","Maize flour production","Soybean processing",
    "Cocoa bean processing","Vegetable farming","Beekeeping & honey production",
    "Dairy processing","Fish smoking","Fruit juice production",
    "Herbal medicine production","Spice processing",
  ],
  "Energy & Power": [
    "10KW micro-hydro turbine","Solar cold storage","Biogas plant construction",
    "Solar panel installation","Wind turbine assembly","Battery storage systems",
    "Solar water pumping","Biomass energy production","LPG distribution",
    "Electricity mini-grid","LED street light installation","Solar irrigation",
  ],
  "Manufacturing": [
    "Paper recycling","Cloth material recycling","Plastic bottle recycling",
    "Metal fabrication","Furniture production","Brick making",
    "Soap & detergent production","Rubber processing","Glass recycling",
    "Electronics assembly","Welding & fabrication","Chemical blending",
  ],
  "Construction & Infrastructure": [
    "Affordable housing construction","Bridge construction","Road building",
    "Water tank installation","Solar borehole drilling","Sanitation facility",
    "Community hall construction","School building","Market shed construction",
  ],
  "Mining & Extractives": [
    "Artisanal gold mining","Limestone quarrying","Sand & gravel extraction",
    "Gemstone cutting & polishing","Coal processing","Iron ore processing",
  ],
  "Logistics & Transport": [
    "Cold chain logistics","Agricultural produce transport","Last-mile delivery",
    "Motorcycle logistics","Warehouse management","Freight forwarding",
    "Cross-border trade logistics",
  ],
  "Technology & Digital": [
    "Mobile app development","E-commerce platform","Agricultural technology",
    "Digital payment solutions","IoT sensor deployment","Data collection service",
    "Software development","IT support & training","Digital content creation",
  ],
  "Environment & Recycling": [
    "E-waste recycling","Plastic waste collection","Organic waste composting",
    "Water treatment","Tree nursery & planting","Carbon credit project",
  ],
  "Fisheries & Aquaculture": [
    "Catfish pond farming","Shrimp aquaculture","Tilapia farming",
    "Fish feed production","Fish smoking & preservation","Seaweed farming",
  ],
  "Textiles & Apparel": [
    "Fabric weaving","Garment production","Ankara printing",
    "Leather goods production","Shoe manufacturing","Tie-dye production",
  ],
};

export const VALUE_CHAIN_STAGES = [
  "Research & Planning","Resource Sourcing","Prototype / Design",
  "Fabrication / Production","Processing","Packaging","Quality Control",
  "Storage","Distribution / Logistics","Installation","Marketing & Sales",
  "Maintenance","Export","End of Life / Recycling",
] as const;

export const DEAL_TYPES = [
  "Collaboration deal","Funding deal","Supply deal","Manufacturing deal",
  "Distribution deal","Professional service deal","Diaspora partnership deal",
  "Equipment lease deal","Investment interest deal","Project execution deal",
] as const;

export const VENTURE_TYPES = [
  "Production","Processing","Fabrication","Installation","Service delivery",
  "Research & Development","Social enterprise","Distribution","Export",
  "Training & Skills","Technology","Cooperative",
] as const;
