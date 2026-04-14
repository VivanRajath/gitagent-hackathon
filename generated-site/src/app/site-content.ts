export const SITE = {
  navbar: { brand: "Eternal Night", links: [{label:"The Lair",href:"/"}, {label:"Events",href:"/events"}, {label:"Blood Bar",href:"/bar"}, {label:"Crypt",href:"/shop"}] },
  hero: {
    headline: "Sink Your Teeth",
    subtext: "Immerse yourself in the darkness, where the creatures of the night come to play. Join us for a night of unholy revelry and unbridled passion.",
    cta1: "Enter the Lair",
    cta2: "Join the Eternal Night",
    imageUrl: "https://image.pollinations.ai/prompt/neon+goth+vampire+lair+dark+alleyway+cinematic?width=1600&height=900&nologo=true&seed=81423",
  },
  cards: [
    {title:"Bloodlust Thursdays",desc:"Indulge in our infamous blood-red cocktails and dance the night away to the darkest beats",imageUrl:"https://image.pollinations.ai/prompt/neon+goth+vampire+lair+dark+alleyway+card?width=400&height=300&nologo=true&seed=46392",pzCard:0},
    {title:"Vampire's Ball",desc:"Join us for a night of masquerade and mystery, where the lines between reality and fantasy blur",imageUrl:"https://image.pollinations.ai/prompt/neon+goth+vampire+lair+dark+alleyway+card2?width=400&height=300&nologo=true&seed=13579",pzCard:1},
    {title:"Gothic Karaoke",desc:"Unleash your inner goth rockstar and belt out the darkest tunes in our crypt-like karaoke lounge",imageUrl:"https://image.pollinations.ai/prompt/neon+goth+vampire+lair+dark+alleyway+card3?width=400&height=300&nologo=true&seed=62781",pzCard:2}
  ],
  features: {
    sectionTitle: "Experience the Darkness",
    items: [
      {icon:"💉",title:"Blood Bar",desc:"Quench your thirst with our signature blood-red cocktails and rare, exotic drinks"},
      {icon:"🔪",title:"The Crypt",desc:"Explore our labyrinthine shop, filled with dark treasures and mysterious artifacts"},
      {icon:"🕷️",title:"The Lair",desc:"Immerse yourself in our cavernous nightclub, where the music is dark and the energy is electric"},
      {icon:"💔",title:"VIP Lounge",desc:"Indulge in the ultimate vampire experience, with private booths and personalized service"}
    ],
  },
  cta: {
    headline: "Join the Eternal Night",
    body: "Become a part of our eternal community, where the night never ends and the darkness never fades. Sign up for exclusive updates, promotions, and invitations to our most unholy events.",
    button: "Join Now",
    imageUrl: "https://image.pollinations.ai/prompt/neon+goth+vampire+lair+dark+alleyway+wide+banner?width=1200&height=400&nologo=true&seed=35146",
  },
  footer: {
    brand: "Eternal Night",
    tagline: "Forever in the Shadows",
    links: [{label:"About Eternal Night",href:"/about"}, {label:"Contact the Undead",href:"/contact"}, {label:"FAQ: The Darkness",href:"/faq"}],
  },
  // Layout variant indices — set by UIUX agent based on site type
  // navbar: 0=Classic 1=Centered 2=Animated 3=GlassCTA 4=Minimal
  // hero:   0=Cinematic 1=Split 2=BoldType 3=Magazine 4=Asymmetric
  // cards:  0=Grid 1=Carousel 2=Featured 3=Masonry 4=List
  // features: 0=IconGrid 1=Numbered 2=Alternating 3=Timeline 4=StatCards
  // cta:    0=Fullbleed 1=Split 2=Minimal 3=GlassCard 4=HorizBar
  // footer: 0=TwoCol 1=Centered 2=Minimal 3=BigBrand 4=DarkCard
  variants: {
    navbar:   2,
    hero:     4,
    cards:    3,
    features: 0,
    cta:      0,
    footer:   1,
  },
};