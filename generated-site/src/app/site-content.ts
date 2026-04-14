export const SITE = {
  navbar: { brand: "Web-Slinger HQ", links: [{label:"Spider-Verse",href:"/"}, {label:"Villains",href:"/villains"}, {label:"Allies",href:"/allies"}, {label:"Gadgets",href:"/gadgets"}] },
  hero: {
    headline: "Protecting NYC",
    subtext: "Join Spider-Man in his quest to defend the city from evil. Explore the dark alleys and towering skyscrapers of Manhattan, and uncover the secrets of your friendly neighborhood Spider-Man.",
    cta1: "Explore the Spider-Verse",
    cta2: "Join the Fight",
    imageUrl: "/images/hero.jpg",
  },
  cards: [
    {title:"The Daily Bugle",desc:"Uncover the latest news and scandals in NYC",imageUrl:"https://image.pollinations.ai/prompt/Daily%20Bugle%20newsroom?width=400&height=300&nologo=true&model=turbo",pzCard:0},
    {title:"Spider-Man's Lair",desc:"Delve into the web-slinger's hidden headquarters",imageUrl:"https://image.pollinations.ai/prompt/Spiderman%20lair%20tech?width=400&height=300&nologo=true&model=turbo",pzCard:1},
    {title:"Supervillains",desc:"Face off against the most notorious foes in the Marvel Universe",imageUrl:"https://image.pollinations.ai/prompt/Supervillains%20dark%20alley?width=400&height=300&nologo=true&model=turbo",pzCard:2}
  ],
  features: {
    sectionTitle: "Spider-Man's Arsenal",
    items: [
      {icon:"🕸️",title:"Web Shooters",desc:"Swing into action with Spider-Man's trusty web shooters"},
      {icon:"🔍",title:"Superhuman Senses",desc:"Unleash your spider-sense to anticipate and react to danger"},
      {icon:"💻",title:"Genius-Level Intellect",desc:"Outsmart your enemies with Spider-Man's quick wit and cunning"},
      {icon:"👊",title:"Superhuman Strength",desc:"Unleash your inner strength to take down even the toughest foes"}
    ],
  },
  cta: {
    headline: "Unite with Spider-Man",
    body: "Join the fight against evil and become a part of the Spider-Verse. Explore the latest comics, movies, and TV shows, and connect with fellow fans from around the world.",
    button: "Join the Web-Heads",
    imageUrl: "https://image.pollinations.ai/prompt/Swing%20into%20action?width=1200&height=400&nologo=true&model=turbo",
  },
  footer: {
    brand: "Web-Slinger HQ",
    tagline: "Swinging into the Dark",
    links: [{label:"About Spider-Man",href:"/about-spiderman"}, {label:"Spider-Man Comics",href:"/comics"}, {label:"Spider-Man Movies",href:"/movies"}, {label:"Spider-Man Games",href:"/games"}],
  },
  // Layout variant indices — set by UIUX agent based on site type
  // navbar: 0=Classic 1=Centered 2=Animated 3=GlassCTA 4=Minimal
  // hero:   0=Cinematic 1=Split 2=BoldType 3=Magazine 4=Asymmetric
  // cards:  0=Grid 1=Carousel 2=Featured 3=Masonry 4=List
  // features: 0=IconGrid 1=Numbered 2=Alternating 3=Timeline 4=StatCards
  // cta:    0=Fullbleed 1=Split 2=Minimal 3=GlassCard 4=HorizBar
  // footer: 0=TwoCol 1=Centered 2=Minimal 3=BigBrand 4=DarkCard
  variants: {
    navbar:   3,
    hero:     0,
    cards:    0,
    features: 0,
    cta:      0,
    footer:   0,
  },
};