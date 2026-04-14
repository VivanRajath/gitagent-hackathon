export const SITE = {
  navbar: { brand: "Web-Slinger's Hub", links: [{label:"The Daily Bugle",href:"/news"}, {label:"Spider-Verse",href:"/multiverse"}, {label:"Gadgets & Gear",href:"/tech"}, {label:"Spider-Friends",href:"/community"}, {label:"The Vault",href:"/archive"}] },
  hero: {
    headline: "Your Friendly Neighborhood Hero",
    subtext: "Explore the Spider-Verse, stay updated on the latest news, and join the community of web-slinging fans!",
    cta1: "Enter the Spider-Verse",
    cta2: "Get the Latest News",
    imageUrl: "/images/hero.jpg",
  },
  cards: [
    {title:"Spider-Man: Into the Spider-Verse",desc:"Discover the animated adventures of Miles Morales and the Spider-Verse crew.",imageUrl:"https://image.pollinations.ai/prompt/Spiderman%20swinging%20through%20Manhattan%20skyscrapers%20sunset%20-%20scene%20one%20-%20photorealistic?width=400&height=300&nologo=true&model=turbo",pzCard:0},
    {title:"Marvel's Spider-Man Games",desc:"Swing into action with the latest Spider-Man games for PS4 and PC.",imageUrl:"https://image.pollinations.ai/prompt/Spiderman%20swinging%20through%20Manhattan%20skyscrapers%20sunset%20-%20scene%20two%20-%20cinematic?width=400&height=300&nologo=true&model=turbo",pzCard:1},
    {title:"Spider-Man Comics",desc:"Read the latest issues and classic storylines from the Marvel Comics universe.",imageUrl:"https://image.pollinations.ai/prompt/Spiderman%20swinging%20through%20Manhattan%20skyscrapers%20sunset%20-%20scene%20three%20-%20artistic?width=400&height=300&nologo=true&model=turbo",pzCard:2}
  ],
  features: {
    sectionTitle: "Web-Slinging Features",
    items: [
      {icon:"🕸️",title:"Web-Slinging 101",desc:"Learn the basics of web-slinging and become a pro like Spider-Man!"},
      {icon:"📸",title:"Spider-Selfies",desc:"Share your Spider-Man cosplay and fan art with the community!"},
      {icon:"🚀",title:"Spider-Verse Explorers",desc:"Join the expedition to explore the vast multiverse of Spider-Man!"},
      {icon:"💻",title:"Gadget Garage",desc:"Get the latest Spider-Man gadgets and tech, from web-shooters to spider-drones!"}
    ],
  },
  cta: {
    headline: "Join the Web-Heads Community",
    body: "Connect with fellow Spider-Man fans, share your passion, and stay updated on the latest news and releases!",
    button: "Sign Up Now",
    imageUrl: "https://image.pollinations.ai/prompt/Spiderman%20swinging%20through%20Manhattan%20skyscrapers%20sunset%20-%20wide%20panoramic%20banner%20-%20dramatic%20sky%20-%20cinematic%20color%20grade?width=1200&height=400&nologo=true&model=turbo",
  },
  footer: {
    brand: "Web-Slinger's Hub",
    tagline: "Swing into the action!",
    links: [{label:"About",href:"/about"}, {label:"Contact",href:"/contact"}, {label:"Marvel Official",href:"https://www.marvel.com/"}],
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
    hero:     1,
    cards:    1,
    features: 2,
    cta:      1,
    footer:   2,
  },
};