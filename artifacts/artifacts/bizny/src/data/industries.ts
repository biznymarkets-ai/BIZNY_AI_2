export interface IndustrySector {
  sector: string;
  subSectors: Array<{
    label: string;
    stamps: string[];
  }>;
}

export const INDUSTRY_TAXONOMY: IndustrySector[] = [
  {
    sector: "Agriculture",
    subSectors: [
      {
        label: "Crop Farming",
        stamps: [
          "Cassava Farming", "Plantain Farming", "Maize Farming", "Rice Farming",
          "Soybean Farming", "Groundnut Farming", "Yam Farming", "Cocoa Farming",
          "Coffee Farming", "Cotton Farming", "Sugarcane Farming", "Okra Farming",
          "Pepper Farming", "Tomato Farming", "Aloe Vera Cultivation",
          "Moringa Cultivation", "Bamboo Cultivation",
        ],
      },
      {
        label: "Agro-Processing",
        stamps: [
          "Cassava Starch Production", "Cassava Flour Processing", "Plantain Flour Production",
          "Tom Brown Production", "Palm Oil Processing", "Palm Kernel Oil Processing",
          "Coconut Oil Extraction", "Soybean Processing", "Groundnut Oil Extraction",
          "Aloe Vera Gel Extraction", "Moringa Powder Processing", "Okra Seed Production",
          "Pepper Drying", "Tomato Paste Production", "Garri Production",
          "Shea Butter Processing", "Cashew Nut Processing",
        ],
      },
      {
        label: "Livestock & Poultry",
        stamps: [
          "Poultry Farming", "Catfish Farming", "Tilapia Farming", "Pig Farming",
          "Goat & Sheep Farming", "Cattle Rearing", "Dairy Production",
          "Bee Keeping / Honey Production", "Snail Farming", "Rabbit Farming",
          "Fish Smoking", "Fish Drying & Preservation",
        ],
      },
      {
        label: "Alternative & Emerging Agri",
        stamps: [
          "Maggot Farming", "Black Soldier Fly Production", "Duckweed Cultivation",
          "Azolla Production", "Water Hyacinth Processing", "Algae Cultivation",
          "Insect Protein Production", "Hydroponics Farming", "Mushroom Cultivation",
          "Aquaponics", "Vertical Farming",
        ],
      },
      {
        label: "Fish & Aquaculture",
        stamps: [
          "Aquaculture / Fish Farming", "Fish Feed Production", "Fish Hatchery",
          "Prawn Farming", "Crab Farming", "Seaweed Farming",
        ],
      },
      {
        label: "Soil & Farm Inputs",
        stamps: [
          "Fertilizer Production", "Compost Manufacturing", "NPK Fertilizer Blending",
          "Organic Farming Inputs", "Seedling Production", "Agricultural Chemicals",
          "Irrigation System Supply",
        ],
      },
    ],
  },
  {
    sector: "Manufacturing",
    subSectors: [
      {
        label: "Food & Beverage",
        stamps: [
          "Packaged Food Production", "Beverage Manufacturing", "Water Sachet & Bottling",
          "Snack Production", "Bread & Bakery", "Noodle Production",
          "Seasoning & Spice Manufacturing", "Dairy & Yoghurt Production",
          "Fruit Juice Processing", "Edible Oil Refining",
        ],
      },
      {
        label: "Industrial Equipment",
        stamps: [
          "Agricultural Equipment Fabrication", "Dehydrator Manufacturing",
          "Milling Machine Production", "Industrial Dryer Manufacturing",
          "Welding Equipment Supply", "Generator Assembly", "Pump Manufacturing",
        ],
      },
      {
        label: "Metal & Fabrication",
        stamps: [
          "Metal Fabrication", "Steel Scrap Recovery", "Aluminium Fabrication",
          "Iron & Steel Production", "Copper Processing", "Foundry & Casting",
          "Structural Steel Manufacturing",
        ],
      },
      {
        label: "Plastics & Packaging",
        stamps: [
          "PVC Pipe Manufacturing", "Packaging Manufacturing", "Plastic Container Production",
          "Flexible Packaging", "Sachet & Bag Manufacturing", "Rubber Products Manufacturing",
        ],
      },
      {
        label: "Building Materials",
        stamps: [
          "Cement Block Production", "Interlocking Brick Production",
          "Asphalt Production", "Bitumen Processing", "Roofing Sheet Manufacturing",
          "Ceramic Tile Production", "Glass Manufacturing", "Paint Production",
          "Plywood & Particle Board", "Wooden Furniture Manufacturing",
        ],
      },
      {
        label: "Textiles & Apparel",
        stamps: [
          "Textile Manufacturing", "Garment Production", "Fabric Dyeing & Finishing",
          "Leather Processing", "Shoe Manufacturing", "Bag & Accessory Production",
          "Knitwear & Knitting",
        ],
      },
      {
        label: "Chemicals & Cosmetics",
        stamps: [
          "Soap & Detergent Manufacturing", "Cosmetics & Personal Care",
          "Industrial Chemicals", "Pharmaceutical Manufacturing",
          "Herbal Product Manufacturing", "Paint & Coating", "Adhesive Production",
        ],
      },
    ],
  },
  {
    sector: "Recycling & Waste",
    subSectors: [
      {
        label: "Plastic Recycling",
        stamps: [
          "Plastic Recycling", "Plastic-to-Fuel Conversion", "PET Bottle Recycling",
          "HDPE Recycling", "Plastic Pellet Production",
        ],
      },
      {
        label: "Metal Recycling",
        stamps: [
          "Aluminium Recycling", "Copper Recycling", "Iron Recycling",
          "Steel Scrap Processing", "Battery Recycling", "Lithium Processing",
          "E-Waste Recycling",
        ],
      },
      {
        label: "Paper & Textiles",
        stamps: [
          "Paper Recycling", "Cardboard Recycling", "Textile Recycling",
          "Rubber Recycling", "Tyre Recycling",
        ],
      },
      {
        label: "Organic Waste",
        stamps: [
          "Biogas Production", "Composting", "Organic Waste Processing",
          "Food Waste to Animal Feed", "Sewage Sludge Treatment",
        ],
      },
    ],
  },
  {
    sector: "Energy",
    subSectors: [
      {
        label: "Solar",
        stamps: [
          "Solar Installation", "Solar Panel Assembly", "Solar Inverter Supply",
          "Solar Mini-Grid Development", "Solar Irrigation Systems",
          "Solar Street Lighting", "Off-Grid Solar Systems",
        ],
      },
      {
        label: "Hydro",
        stamps: [
          "Water Turbine Construction", "Micro Hydro Development",
          "Small Hydro Power", "Irrigation Hydro Systems",
        ],
      },
      {
        label: "Wind & Other",
        stamps: [
          "Wind Turbine Construction", "Wind Farm Development",
          "Biogas Energy Generation", "Biomass Power",
          "Hybrid Energy Systems", "Battery Storage Systems",
        ],
      },
      {
        label: "Fossil & Petroleum",
        stamps: [
          "Petroleum Product Distribution", "LPG Supply & Bottling",
          "Diesel Supply", "Lubricant Production",
        ],
      },
    ],
  },
  {
    sector: "Logistics & Trade",
    subSectors: [
      {
        label: "Cold Chain",
        stamps: [
          "Cold Room Construction", "Cold Chain Logistics", "Refrigerated Transport",
          "Cold Storage Operations", "Fish & Meat Cold Storage",
        ],
      },
      {
        label: "Warehousing & Storage",
        stamps: [
          "Warehouse Operations", "Commodity Aggregation", "Grain Storage",
          "Dry Port Operations", "Last-Mile Delivery",
        ],
      },
      {
        label: "Export & Import",
        stamps: [
          "Export Documentation", "Import Clearing & Forwarding",
          "Commodity Export", "Non-Oil Export", "Trade Finance Facilitation",
        ],
      },
      {
        label: "Transport",
        stamps: [
          "Road Freight Transport", "Agricultural Produce Transport",
          "Motorcycle Logistics", "Fleet Management", "Cross-Border Trade",
        ],
      },
    ],
  },
  {
    sector: "Construction",
    subSectors: [
      {
        label: "Civil & Infrastructure",
        stamps: [
          "Civil Construction", "Road Construction", "Bridge Construction",
          "Dam Construction", "Drainage & Water Infrastructure",
        ],
      },
      {
        label: "Building & Real Estate",
        stamps: [
          "Residential Construction", "Commercial Building", "Housing Development",
          "Real Estate Development", "Interior Design & Fitting",
          "Electrical Installation", "Plumbing & Sanitation",
        ],
      },
      {
        label: "Industrial Construction",
        stamps: [
          "Factory Construction", "Warehouse Construction",
          "Cold Room Installation", "Industrial Plant Construction",
        ],
      },
    ],
  },
  {
    sector: "Mining & Petrochemicals",
    subSectors: [
      {
        label: "Mining",
        stamps: [
          "Solid Minerals Mining", "Gold Mining", "Limestone Quarrying",
          "Granite Quarrying", "Coal Mining", "Iron Ore Mining",
          "Coltan Mining", "Gemstone Mining",
        ],
      },
      {
        label: "Petrochemicals",
        stamps: [
          "Crude Oil Exploration", "Petroleum Refining",
          "Bitumen Processing", "Natural Gas Processing",
          "Petrochemical Manufacturing",
        ],
      },
    ],
  },
  {
    sector: "Technology & Electronics",
    subSectors: [
      {
        label: "Software & Digital",
        stamps: [
          "Software Development", "Mobile App Development",
          "Web Development", "Data Analytics", "AI & Machine Learning",
          "Digital Marketing", "E-Commerce",
        ],
      },
      {
        label: "Electronics & Hardware",
        stamps: [
          "Electronics Manufacturing", "Electronics Repair",
          "Solar Electronics Assembly", "Computer Hardware",
          "Telecoms Equipment Supply", "CCTV & Security Systems",
        ],
      },
    ],
  },
  {
    sector: "Services & Verification",
    subSectors: [
      {
        label: "Business Services",
        stamps: [
          "Business Verification", "Field Inspection",
          "Quality Assurance", "Compliance Services",
          "Accounting & Bookkeeping", "Legal Services",
          "Business Consulting", "Market Research",
        ],
      },
      {
        label: "Health & Education",
        stamps: [
          "Healthcare Services", "Pharmacy", "Medical Equipment Supply",
          "Education & Training", "Vocational Training",
          "E-Learning Content", "Early Childhood Education",
        ],
      },
      {
        label: "Financial Services",
        stamps: [
          "Microfinance", "Cooperative Finance", "Insurance",
          "Investment Advisory", "Savings Group Operations",
        ],
      },
      {
        label: "Creative & Media",
        stamps: [
          "Fashion Design", "Media Production", "Film & TV",
          "Music Production", "Photography", "Arts & Crafts",
          "Advertising Agency",
        ],
      },
    ],
  },
];

export const ALL_STAMPS: string[] = INDUSTRY_TAXONOMY.flatMap(s =>
  s.subSectors.flatMap(ss => ss.stamps)
);

export const ALL_SECTORS: string[] = INDUSTRY_TAXONOMY.map(s => s.sector);

export function getSubSectors(sector: string): string[] {
  return INDUSTRY_TAXONOMY.find(s => s.sector === sector)?.subSectors.map(ss => ss.label) ?? [];
}

export function getStamps(sector: string, subSector?: string): string[] {
  const sec = INDUSTRY_TAXONOMY.find(s => s.sector === sector);
  if (!sec) return [];
  if (!subSector) return sec.subSectors.flatMap(ss => ss.stamps);
  return sec.subSectors.find(ss => ss.label === subSector)?.stamps ?? [];
}

export function findSectorForStamp(stamp: string): { sector: string; subSector: string } | null {
  for (const sec of INDUSTRY_TAXONOMY) {
    for (const ss of sec.subSectors) {
      if (ss.stamps.includes(stamp)) return { sector: sec.sector, subSector: ss.label };
    }
  }
  return null;
}
