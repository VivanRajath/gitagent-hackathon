export const SITE = {
  navbar: { brand: "Greenwood Interiors", links: [{label:"Home",href:"/"}, {label:"Services",href:"/services"}, {label:"Portfolio",href:"/portfolio"}, {label:"Sustainability",href:"/sustainability"}, {label:"Contact",href:"/contact"}] },
  hero: {
    headline: "Bring the Outdoors In",
    subtext: "Add some tagline to the hero texture",
    cta1: "Discover Your Dream Space",
    cta2: "Explore Our Portfolio",
    imageUrl: "/images/hero.jpg",
  },
  cards: [
    {title:"Eco-Friendly Design",desc:"Our team crafts spaces that not only look stunning but also reduce environmental impact.",imageUrl:"https://image.pollinations.ai/prompt/Eco-Friendly%20Design%20natural%20materials%20plants%20cinematic?width=400&height=300&nologo=true&model=turbo",pzCard:0},
    {title:"Natural Materials",desc:"We incorporate sustainable materials and products to bring warmth and authenticity to your interior.",imageUrl:"https://image.pollinations.ai/prompt/Natural%20Materials%20interior%20design%20plants%20cinematic?width=400&height=300&nologo=true&model=turbo",pzCard:1},
    {title:"Biophilic Design",desc:"By connecting buildings to nature, we improve well-being, productivity, and overall quality of life.",imageUrl:"https://image.pollinations.ai/prompt/Biophilic%20Design%20plants%20natural%20light%20cinematic?width=400&height=300&nologo=true&model=turbo",pzCard:2}
  ],
  features: {
    sectionTitle: "Our Approach to Sustainable Design",
    items: [
      {icon:"🌿",title:"Green Building Practices",desc:"We adopt methods and materials that minimize waste and reduce carbon footprint."},
      {icon:"💡",title:"Energy Efficiency",desc:"From lighting to insulation, we optimize every element for a reduced environmental impact."},
      {icon:"🏠",title:"Sustainable Furniture",desc:"Our curated selection of eco-friendly furniture ensures comfort and style without compromising on values."},
      {icon:"📈",title:"Wellness-Centric Design",desc:"By incorporating natural elements and promoting airflow, we create spaces that boost occupants' health and happiness."}
    ],
  },
  cta: {
    headline: "Start Your Sustainable Design Journey",
    body: "Let Greenwood Interiors guide you in creating a space that not only reflects your style but also contributes to a greener future.",
    button: "Get in Touch",
    imageUrl: "https://image.pollinations.ai/prompt/Greenwood%20Interiors%20wide%20panoramic%20banner%20natural%20design%20cinematic%20color%20grade?width=1200&height=400&nologo=true&model=turbo",
  },
  footer: {
    brand: "Greenwood Interiors",
    tagline: "something regarding integers",
    links: [{label:"About Us",href:"/about"}, {label:"Services & Process",href:"/services"}, {label:"Blog: Sustainable Living Tips",href:"/blog"}],
  },
  // Layout variant indices — set by UIUX agent based on site type
  // navbar: 0=Classic 1=Centered 2=Animated 3=GlassCTA 4=Minimal
  // hero:   0=Cinematic 1=Split 2=BoldType 3=Magazine 4=Asymmetric
  // cards:  0=Grid 1=Carousel 2=Featured 3=Masonry 4=List
  // features: 0=IconGrid 1=Numbered 2=Alternating 3=Timeline 4=StatCards
  // cta:    0=Fullbleed 1=Split 2=Minimal 3=GlassCard 4=HorizBar
  // footer: 0=TwoCol 1=Centered 2=Minimal 3=BigBrand 4=DarkCard
  variants: {
    navbar:   1,
    hero:     1,
    cards:    0,
    features: 3,
    cta:      2,
    footer:   2,
  },
};