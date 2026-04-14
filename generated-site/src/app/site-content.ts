export const SITE = {
  navbar: { brand: "Ichiraku Ramen", links: [{label:"Home",href:"/"}, {label:"Ramen Menu",href:"/menu"}, {label:"Ninja Combos",href:"/combos"}, {label:"The Hidden Leaf",href:"/about"}, {label:"Contact Teuchi",href:"/contact"}] },
  hero: {
    headline: "Slurp Down Victory!",
    subtext: "Gather your team and fuel up with Ichiraku's legendary ramen, just like Naruto and his friends!",
    cta1: "Order Now and Get a Free Ninja Scroll!",
    cta2: "Explore Our Menu and Unleash Your Inner Ninja",
    imageUrl: "https://image.pollinations.ai/prompt/Naruto%20Ichiraku%20Ramen%20Shop%20vibrant%20colorful%20anime%20-%20cinematic%20hero%20wide%20shot%20-%20dramatic%20lighting%20-%20ultra%20detailed?width=1600&height=900&nologo=true&model=turbo",
  },
  cards: [
    {title:"Naruto's Favorite",desc:"Our signature miso ramen, inspired by the Seventh Hokage's favorite dish.",imageUrl:"https://image.pollinations.ai/prompt/Naruto%20Ichiraku%20Ramen%20Shop%20vibrant%20colorful%20anime%20-%20scene%20one%20-%20photorealistic?width=400&height=300&nologo=true&model=turbo",pzCard:0},
    {title:"Sasuke's Spicy",desc:"A bold, spicy ramen for those who dare to take on the Uchiha challenge.",imageUrl:"https://image.pollinations.ai/prompt/Naruto%20Ichiraku%20Ramen%20Shop%20vibrant%20colorful%20anime%20-%20scene%20two%20-%20cinematic?width=400&height=300&nologo=true&model=turbo",pzCard:1},
    {title:"Sakura's Delight",desc:"A gentle, soothing ramen for the kunoichi in you, with a hint of cherry blossom flavor.",imageUrl:"https://image.pollinations.ai/prompt/Naruto%20Ichiraku%20Ramen%20Shop%20vibrant%20colorful%20anime%20-%20scene%20three%20-%20artistic?width=400&height=300&nologo=true&model=turbo",pzCard:2}
  ],
  features: {
    sectionTitle: "Ninja Training Fuel",
    items: [
      {icon:"🍜",title:"Ramen Variety",desc:"From classic tonkotsu to spicy miso, our ramen is crafted to fuel your ninja training."},
      {icon:"🥋",title:"Ninja Combos",desc:"Pair your ramen with our special ninja combos, featuring gyoza, edamame, and more!"},
      {icon:"🍴",title:"Ichiraku's Secret Sauce",desc:"Our secret sauce is made with love and a hint of ninja magic, adding an extra kick to your meal."},
      {icon:"🎁",title:"Ninja Rewards",desc:"Collect stamps and earn rewards, just like Naruto earning his ninja stars!"}
    ],
  },
  cta: {
    headline: "Unleash Your Ninja Spirit!",
    body: "Join the Ichiraku Ramen community and stay up-to-date on new menu items, promotions, and ninja events!",
    button: "Join the Ninja Squad",
    imageUrl: "https://image.pollinations.ai/prompt/Naruto%20Ichiraku%20Ramen%20Shop%20vibrant%20colorful%20anime%20-%20wide%20panoramic%20banner%20-%20dramatic%20sky%20-%20cinematic%20color%20grade?width=1200&height=400&nologo=true&model=turbo",
  },
  footer: {
    brand: "Ichiraku Ramen",
    tagline: "Fuel for the Ninja Soul",
    links: [{label:"About Ichiraku",href:"/about"}, {label:"Contact Us",href:"/contact"}, {label:"Ninja Blog",href:"/blog"}],
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
    hero:     3,
    cards:    1,
    features: 2,
    cta:      1,
    footer:   2,
  },
};