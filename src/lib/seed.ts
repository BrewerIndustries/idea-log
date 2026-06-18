import type { AccentKey, Block, Stage } from "./types";

export interface SeedIdea {
  title: string;
  subtitle?: string;
  icon?: string;
  accent?: AccentKey;
  stage?: Stage;
  concept?: string;
  tags?: string[];
  sections?: Block[];
  pinned?: boolean;
}

// The five ideas from the original reference showcase, transcribed into the
// generalised block model. Inserted only into a brand-new (empty) database so a
// fresh deploy looks alive; every one is editable and deletable in the UI.
export const SEED_IDEAS: SeedIdea[] = [
  {
    title: "Stellar Ascent",
    subtitle: "Progress Knight: Reborn clone — space exploration theme",
    icon: "🚀",
    accent: "blue",
    stage: "seed",
    tags: ["Idle RPG", "Incremental", "Sci-fi", "Prestige system"],
    concept:
      "A text-based incremental RPG inspired by Progress Knight, where the player cycles through lives as different space-age roles — from asteroid miner to starship captain to interstellar diplomat. Each life unlocks new skills, technologies, and star systems to explore. Prestige resets the timeline but leaves permanent upgrades, accelerating future playthroughs.",
    sections: [
      {
        type: "grid",
        label: "Core systems",
        items: [
          { name: "Roles & careers", desc: "Crew member to engineer to captain to admiral, each unlocking new stat trees" },
          { name: "Skills", desc: "Astrogation, xenobiology, quantum mechanics, diplomacy — passive XP gain" },
          { name: "Resources", desc: "Credits, fuel, rare minerals, research data — managed per-life" },
          { name: "Prestige reincarnation", desc: "Rebirth as a new species or faction, retaining legacy bonuses" },
          { name: "Star map", desc: "Unlock new systems and factions as civilisation-level milestones are reached" },
          { name: "Events", desc: "Random encounters — solar storms, alien contact, derelict ships — with skill-gated outcomes" },
        ],
      },
      {
        type: "links",
        label: "Reference",
        items: [{ label: "PKR", url: "https://camerongott.github.io/progress-knight/" }],
      },
    ],
  },
  {
    title: "Ember & Ash",
    subtitle: "Dark discovery idle — survival to civilisation",
    icon: "🪵",
    accent: "amber",
    stage: "seed",
    tags: ["Discovery", "Survival", "Dark atmosphere", "City builder"],
    concept:
      "You wake alone in a cold, dark cabin. The screen shows almost nothing — just a single button. As you chop wood, light a fire, and scrape together food, the world slowly reveals itself. New buttons, options, and systems emerge only as you earn them. The tone is bleak and atmospheric; discovery is the core loop. What started as desperate survival quietly becomes a sprawling settlement, then a village, then something larger — though the darkness never fully lifts.",
    sections: [
      {
        type: "phases",
        label: "Progression arc",
        items: [
          { name: "Survive.", text: "One button: chop wood. Light a fire before you freeze. The UI is almost empty — cold and sparse by design.", dot: "amber" },
          { name: "Gather.", text: "Forage for food. Hunt. A hunger meter appears. New verbs unlock — craft, store, explore nearby.", dot: "amber" },
          { name: "Build.", text: "Upgrade the cabin. Add a shed, a storehouse. Resources diversify — stone, pelts, dried food.", dot: "teal" },
          { name: "Attract.", text: "A stranger arrives. Then another. Assign roles — woodcutter, hunter, builder. Manage morale and warmth.", dot: "teal" },
          { name: "Grow.", text: "Hamlet to village to town. Trade routes, a tavern, a healer. Seasons change; winters get harder.", dot: "blue" },
          { name: "Uncover.", text: "Strange things in the forest. Ruins. Hints of why you woke there alone. Lore bleeds in slowly.", dot: "purple" },
        ],
      },
      {
        type: "grid",
        label: "Core systems",
        items: [
          { name: "UI discovery", desc: "Buttons and panels only appear when unlocked — the interface grows with the player" },
          { name: "Warmth & hunger", desc: "Survival meters that never fully go away — always a background pressure" },
          { name: "Settler management", desc: "Assign roles, track morale, lose people to harsh winters or bad decisions" },
          { name: "Seasons", desc: "Each winter is harder; preparation in summer/autumn is essential" },
          { name: "Dark lore layer", desc: "Environmental storytelling — journal scraps, ruins, NPC whispers — never fully explained" },
          { name: "Atmosphere", desc: "Minimal palette, sparse UI, slow ambient pace — dread as aesthetic" },
        ],
      },
    ],
  },
  {
    title: "Chaos",
    subtitle: "Cosy aviation management — three unlockable layers, one gloriously broken operation",
    icon: "✈️",
    accent: "sky",
    stage: "seed",
    tags: ["Airport", "Airline", "ATC", "Chaos", "Cosy & stylised"],
    concept:
      "A unified aviation sim where you start by running a tiny airstrip and gradually unlock three interconnected management layers: the airport on the ground, the airline in the sky, and the control tower orchestrating it all. Each layer idles on its own when you are not looking, staffed by a rotating cast of quirky employees who are trying their best. You focus on one at a time and switch when crises demand your attention — which is always. The aesthetic is warm and illustrated throughout; the disasters are frequent, escalating, and extremely funny.",
    sections: [
      {
        type: "grid",
        label: "The three layers",
        items: [
          { name: "🏢 Terminal", desc: "Gates, lounges, staff, baggage, shops. Build and expand the physical airport. Things break constantly. (Unlocked first)" },
          { name: "🛫 Airline", desc: "Routes, fleet, pilots, pricing, rival carriers. Run the business behind the flights. (Unlocked mid-game)" },
          { name: "🗼 Tower", desc: "Radar, sequencing, radio, weather. Guide planes in and out — your own airline included. (Unlocked late-game)" },
        ],
      },
      {
        type: "phases",
        label: "Progression arc",
        items: [
          { name: "One runway.", text: "A single gate. You handle everything. Something goes wrong on day one.", dot: "sky" },
          { name: "Airport grows.", text: "More gates, staff, shops. Chaos events multiply. You start delegating. The delegates also cause chaos.", dot: "sky" },
          { name: "Airline unlocks.", text: "You start your own carrier. Now your planes are the ones your ground crew is failing to load on time.", dot: "purple" },
          { name: "Two layers running.", text: "Switch between terminal and airline dashboards. Each idles passably without you; both deteriorate entertainingly when you are away too long.", dot: "purple" },
          { name: "Tower unlocks.", text: "Now you can see every plane you operate from above. You can also see every mistake in real time.", dot: "teal" },
          { name: "Full operation.", text: "All three layers active. You are a ground crew manager, an airline CEO, and an air traffic controller simultaneously. Switch at will. Pray frequently.", dot: "teal" },
        ],
      },
      {
        type: "list",
        label: "Cross-layer chaos events (sample)",
        tone: "rose",
        items: [
          "Your airline's most profitable route is currently being blocked by a geese incident on your own runway. Both layers need you.",
          "A pilot from your airline has been cleared by your ATC to land — but ground crew in the terminal forgot to assign a gate. The plane is circling.",
          "Your baggage handler union is striking. The airline layer is losing money. The ATC layer is fine — for now — but three inbound flights are carrying their luggage.",
          "The tower just handed off a flight to the wrong sector. That flight is yours. Your airline's VP is on board.",
          "All three layers have a crisis simultaneously. A notification appears: “Your deputy manager has gone to get a sandwich. He has not returned.”",
        ],
      },
      {
        type: "grid",
        label: "Core systems",
        items: [
          { name: "Layer switching", desc: "One active layer at a time; others idle with staff AI — quality degrades entertainingly without oversight" },
          { name: "Quirky staff", desc: "Shared roster across layers; a bad hire in the terminal can ripple into the airline and tower" },
          { name: "Cross-layer events", desc: "Crises that span multiple layers simultaneously, demanding rapid switching" },
          { name: "Idle degradation", desc: "Layers do not collapse while unattended, but efficiency and satisfaction slowly drift downward" },
          { name: "Reputation meter", desc: "A single public reputation score fed by all three layers — disasters in any layer hurt the whole brand" },
          { name: "Unlock pacing", desc: "Each new layer is a surprise reveal — the game does not tell you what is coming next" },
        ],
      },
    ],
  },
  {
    title: "Taco Loco",
    subtitle: "Mobile-first top-down taco restaurant sim — from line cook to taco empire",
    icon: "🌮",
    accent: "red",
    stage: "exploring",
    tags: ["Restaurant sim", "Chaos", "Tycoon", "Top-down", "Mobile-first", "Cartoonish"],
    concept:
      "You start behind the counter of a single struggling taco stand, personally assembling every order before the customer loses patience. As the lunch rush hits, things spiral immediately: toppings run out, the salsa dispenser explodes, a customer wants seventeen modifications. Survive the shift, earn enough to upgrade, and slowly build your operation from one chaotic stand into a multi-location taco empire — each new location introducing fresh disasters and an ever-more-unhinged staff roster. Same cosy-chaotic energy as the Chaos series, but greasier.",
    sections: [
      {
        type: "grid",
        label: "Platform & style",
        items: [
          { name: "Platform", desc: "Mobile-first web app; touch interactions throughout, designed for portrait phone" },
          { name: "Visual style", desc: "Cartoonish and colourful; bold outlines, bright palette, expressive character portraits" },
          { name: "Core input", desc: "Tap stations to work them; drag finished items onto order cards to complete orders" },
          { name: "Staff input", desc: "Tap a staff member then tap a station to redirect them; they auto-roam otherwise" },
        ],
      },
      {
        type: "grid",
        label: "v0.1 design (first build)",
        items: [
          { name: "Stations (4)", desc: "Grill, Assembly, Toppings, Register — tap to work, progress bar fills, item pops out ready to drag" },
          { name: "Order cards", desc: "Float in from the left, queue along the bottom; each shows required items with a patience countdown" },
          { name: "Assembly flow", desc: "Tap station to produce item, drag finished item from staging area onto the matching order card" },
          { name: "Staff hire (1)", desc: "One line cook with a specialty and a quirk; auto-works stations by backlog, tap to redirect" },
          { name: "Shift loop", desc: "3-minute timed shifts; end-of-shift earnings screen shows tips, completion rate, chaos rating" },
          { name: "Upgrade shop", desc: "3 choices between shifts: faster grill, extra patience time, station auto-fill, etc." },
          { name: "Chaos events", desc: "One random event per shift — timed pop-up you tap to resolve (salsa explosion, influencer visit, surprise rush)" },
        ],
      },
      {
        type: "phases",
        label: "Progression arc (full game)",
        items: [
          { name: "The stand.", text: "Top-down view of a single counter. You assemble tacos manually. Orders stack up. Someone always wants extra everything.", dot: "red" },
          { name: "First hire.", text: "Bring on a kitchen assistant with exactly one useful skill and one catastrophic flaw. Delegate assembly. Supervise constantly.", dot: "red" },
          { name: "Full kitchen.", text: "Separate stations: grill, assembly, toppings, register. Staff each one. Bottlenecks emerge immediately.", dot: "amber" },
          { name: "Second location.", text: "Open a new stand across town. Now split attention between two kitchens. The first one was finally running smoothly. Past tense.", dot: "amber" },
          { name: "Brand & menu.", text: "Develop signature tacos, seasonal specials, a loyalty card. Food critics appear. One of them is impossible to please.", dot: "teal" },
          { name: "The empire.", text: "Multiple locations, a commissary kitchen, a franchise model. You no longer make a single taco. You just watch the disasters unfold from a management dashboard.", dot: "purple" },
        ],
      },
      {
        type: "list",
        label: "Chaos events (sample)",
        tone: "rose",
        items: [
          "A food influencer has arrived unannounced. They are filming. The guacamole is currently on the floor.",
          "Table 4 has sent back the same taco three times. It is a perfect taco. They know it. They are enjoying this.",
          "Your grill cook has challenged a customer to a salsa heat contest. A crowd has gathered. Health inspector is due in 20 minutes.",
          "The tortilla delivery is late. You have 40 orders queued and a bag of tostada shells. Adapt.",
          "Both your cashiers have quit simultaneously to start their own taco stand. It is across the street. It already has a line.",
        ],
      },
      {
        type: "grid",
        label: "Core systems (full game)",
        items: [
          { name: "Top-down kitchen", desc: "Live spatial view of the kitchen; tap stations yourself or direct staff in real time" },
          { name: "Order queue", desc: "Timed orders with patience meters; complex customisations are worth more but punishing to flub" },
          { name: "Staff with quirks", desc: "Each hire has a specialty and a disaster trait — great at grill, terrible near the salsa" },
          { name: "Menu R&D", desc: "Unlock new taco types, sauces, and sides; seasonal specials drive surge demand" },
          { name: "Multi-location", desc: "Manage multiple stands from a zoomed-out map view; each location has its own staff and vibe" },
          { name: "Reputation & reviews", desc: "Customer ratings feed a public score; viral moments (good and bad) cause sudden traffic spikes" },
        ],
      },
    ],
  },
  {
    title: "Poker Palace",
    subtitle: "Retro video poker machine — fake credits, real nostalgia",
    icon: "🃏",
    accent: "green",
    stage: "seed",
    tags: ["Card game", "Retro", "Fake credits", "Multi-variant"],
    concept:
      "A faithfully retro video poker machine running in the browser, styled like a classic casino cabinet — chunky pixel font, scanline aesthetic, satisfying button clicks. You start with a stack of fake credits and work through multiple poker variants, each unlocked as you play. No real money, no pressure, just the pure loop of deal, hold, draw, and pray. The machine remembers your best runs and tracks lifetime stats across variants.",
    sections: [
      {
        type: "grid",
        label: "Poker variants",
        items: [
          { name: "Jacks or Better", desc: "The classic. Unlocked from the start. Pairs of Jacks or higher pay out. Clean and essential." },
          { name: "Deuces Wild", desc: "All 2s are wild. Minimum payout is three of a kind. Strategy shifts completely." },
          { name: "Double Bonus", desc: "Four Aces pays a massive bonus. Rewards aggressive play chasing the top hand." },
          { name: "Joker Poker", desc: "53-card deck with a Joker wild. Two-pair minimum to pay. Unpredictable and chaotic." },
          { name: "Bonus Poker", desc: "Enhanced payouts for four-of-a-kind hands. A step up from Jacks or Better for veterans." },
          { name: "???", desc: "A mystery variant unlocked at a credit milestone. Revealed only when you get there." },
        ],
      },
      {
        type: "phases",
        label: "Progression & unlocks",
        items: [
          { name: "Start.", text: "Jacks or Better only. 1000 fake credits. One denomination: 1 credit per hand.", dot: "teal" },
          { name: "First unlock.", text: "Hit a Royal Flush or reach a credit threshold — new variant slot lights up on the machine.", dot: "teal" },
          { name: "Denominations.", text: "Higher credit bets unlock: 5-credit and 25-credit hands, with proportionally bigger payouts.", dot: "blue" },
          { name: "Cabinet upgrades.", text: "Cosmetic machine skins unlock at milestones — neon, wood-panel, space-age chrome.", dot: "blue" },
          { name: "High roller.", text: "All variants unlocked. Max bet enabled. Lifetime leaderboard of best single-session runs.", dot: "purple" },
        ],
      },
      {
        type: "grid",
        label: "Core systems",
        items: [
          { name: "Retro cabinet UI", desc: "Styled as a physical machine — chunky pixel font, CRT scanlines, physical-feel buttons" },
          { name: "Hold mechanic", desc: "Tap or click cards to hold before the draw; clear visual state for held vs discarded" },
          { name: "Fake credits only", desc: "No real money, no IAP, no pressure — credits reset with an “Insert Coin” button if you bust" },
          { name: "Paytable display", desc: "Each variant shows its own paytable on the machine face; highlights current qualifying hands" },
          { name: "Stats tracking", desc: "Lifetime hands played, biggest win, Royal Flush count, best session per variant" },
          { name: "Cabinet skins", desc: "Cosmetic unlocks change the entire machine aesthetic — neon, vintage wood, space-age chrome" },
        ],
      },
    ],
  },
];
