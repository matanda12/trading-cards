import { PrismaClient, Rarity } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter } as never)

const FACTION_COLORS: Record<string, { bg: string; fg: string }> = {
  Arcane: { bg: '1a0a3d', fg: 'c084fc' },
  Light:  { bg: '3d2e00', fg: 'fbbf24' },
  Iron:   { bg: '1a1a1a', fg: '9ca3af' },
  Shadow: { bg: '050510', fg: '818cf8' },
  Water:  { bg: '011c38', fg: '38bdf8' },
  Fire:   { bg: '2d0800', fg: 'f97316' },
  Nature: { bg: '081a08', fg: '4ade80' },
}

const RARITY_MAP: Record<string, Rarity> = {
  Common: Rarity.COMMON,
  Uncommon: Rarity.UNCOMMON,
  Rare: Rarity.RARE,
  Epic: Rarity.EPIC,
  Legendary: Rarity.LEGENDARY,
}

const RARITY_WEIGHTS: Record<string, number> = {
  LEGENDARY: 1,
  EPIC: 4,
  RARE: 10,
  UNCOMMON: 25,
  COMMON: 60,
}

const csvCards = [
  { id: 1, name: 'Chronos Wyrm', rarity: 'Legendary', faction: 'Arcane', description: 'Time folds around its wings. When it passes overhead, yesterday and tomorrow blur into one shadow.' },
  { id: 2, name: 'Astral Empress', rarity: 'Legendary', faction: 'Light', description: 'She wears the night sky like a crown. Constellations shift when she raises her hand.' },
  { id: 3, name: 'Worldbreaker Colossus', rarity: 'Legendary', faction: 'Iron', description: 'An ancient giant awakened beneath the earth. Every step cracks stone, steel, and kingdoms alike.' },
  { id: 4, name: 'Obsidian Monarch', rarity: 'Epic', faction: 'Shadow', description: 'A fallen ruler sealed inside volcanic glass. His throne is gone, but his command still bends the weak.' },
  { id: 5, name: 'Spirit Reaper', rarity: 'Epic', faction: 'Shadow', description: 'It gathers souls that lose their way between life and death. Its lantern glows brighter with every name forgotten.' },
  { id: 6, name: 'Storm Herald', rarity: 'Epic', faction: 'Water', description: 'Thunder speaks through its voice. Wherever it walks, the sky gathers for war.' },
  { id: 7, name: 'Moonfang Alpha', rarity: 'Epic', faction: 'Nature', description: 'The sacred pack follows its silver howl. Under the full moon, even hunters become prey.' },
  { id: 8, name: 'Ember Titan', rarity: 'Epic', faction: 'Fire', description: 'Born from the heart of a dying volcano. Its body burns with a fire no river can silence.' },
  { id: 9, name: 'Sunfire Valkyrie', rarity: 'Epic', faction: 'Light', description: 'A golden-winged champion sent from the heavens. Her blade turns darkness into ash.' },
  { id: 10, name: 'Abyss Walker', rarity: 'Epic', faction: 'Shadow', description: 'It steps through cracks in reality. Those who follow its footprints rarely return to the same world.' },
  { id: 11, name: 'Frost Revenant', rarity: 'Epic', faction: 'Water', description: 'A knight frozen before its final battle. Centuries later, its oath still moves the ice.' },
  { id: 12, name: 'Verdant Queen', rarity: 'Epic', faction: 'Nature', description: 'The oldest forest bows when she speaks. Roots, thorns, and beasts rise to defend her crown.' },
  { id: 13, name: 'Arcstorm Dragon', rarity: 'Epic', faction: 'Arcane', description: 'Magic rages beneath every scale. Its breath tears the air with lightning and spellfire.' },
  { id: 14, name: 'Rune Guardian', rarity: 'Rare', faction: 'Iron', description: 'Ancient symbols glow across its armor. It protects secrets too dangerous for mortal hands.' },
  { id: 15, name: 'Coral Leviathan', rarity: 'Rare', faction: 'Water', description: 'A colossal shape sleeping beneath the reef. Sailors lower their voices when the water turns still.' },
  { id: 16, name: 'Thorn Beast', rarity: 'Rare', faction: 'Nature', description: 'A savage creature wrapped in living vines. The deeper the wound, the faster its thorns grow.' },
  { id: 17, name: 'Skybreaker Griffin', rarity: 'Rare', faction: 'Light', description: 'It rules the cliffs where storms are born. One dive from its talons can split a battlefield.' },
  { id: 18, name: 'Ashen Knight', rarity: 'Rare', faction: 'Fire', description: 'He rose from a field of burned banners. The flames that killed him now guard his armor.' },
  { id: 19, name: 'Tidecaller', rarity: 'Rare', faction: 'Water', description: 'She sings to the moonlit sea. Waves answer her voice like loyal soldiers.' },
  { id: 20, name: 'Frostfang Bear', rarity: 'Rare', faction: 'Water', description: 'A white-furred giant of the frozen north. Its roar turns warm breath into crystal frost.' },
  { id: 21, name: 'Crystal Stag', rarity: 'Rare', faction: 'Nature', description: 'Its antlers shine with forest starlight. Travelers who follow its glow are never truly lost.' },
  { id: 22, name: 'Hollow Warden', rarity: 'Rare', faction: 'Shadow', description: 'It patrols ruins abandoned by the living. Every empty hall remembers the sound of its steps.' },
  { id: 23, name: 'Ironfang Warrior', rarity: 'Rare', faction: 'Iron', description: 'A brutal veteran fitted with steel jaws. He bites through shields as easily as fear.' },
  { id: 24, name: 'Wildfire Drake', rarity: 'Rare', faction: 'Fire', description: 'A restless dragonkin that leaves burning trails behind. Forests fall silent before it arrives.' },
  { id: 25, name: 'Silver Ranger', rarity: 'Rare', faction: 'Light', description: 'A lone hunter sworn to track creatures of darkness. His arrows shine long after they strike.' },
  { id: 26, name: 'Sunblade Duelist', rarity: 'Rare', faction: 'Light', description: 'He trained beneath the first light of every dawn. His sword moves faster than shadow can flee.' },
  { id: 27, name: 'Gravebound Archer', rarity: 'Rare', faction: 'Shadow', description: 'A dead marksman still guarding a forgotten war. Its arrows find hearts that no longer beat.' },
  { id: 28, name: 'Stormhorn Minotaur', rarity: 'Rare', faction: 'Water', description: 'Lightning coils around its massive horns. Each charge sounds like thunder breaking stone.' },
  { id: 29, name: 'Sapphire Sorcerer', rarity: 'Rare', faction: 'Arcane', description: 'She channels spells through a flawless blue crystal. Every incantation rings like glass in the air.' },
  { id: 30, name: 'Bloodroot Druid', rarity: 'Rare', faction: 'Nature', description: 'He draws strength from roots fed by ancient battles. The earth remembers every drop.' },
  { id: 31, name: 'Rift Stalker', rarity: 'Rare', faction: 'Arcane', description: 'It hunts through tears in space. A locked door means nothing to a creature that walks between moments.' },
  { id: 32, name: 'Ironhide Mammoth', rarity: 'Rare', faction: 'Iron', description: 'An armored giant from the frozen plains. Its charge leaves trenches where roads once stood.' },
  { id: 33, name: 'Ember Witch', rarity: 'Rare', faction: 'Fire', description: 'Sparks follow every flick of her fingers. Her curses burn slowly and never cleanly.' },
  { id: 34, name: 'Nightscale Basilisk', rarity: 'Rare', faction: 'Shadow', description: 'Its dark scales drink the light around it. One glance can turn courage into stone.' },
  { id: 35, name: 'Duskwing Harpy', rarity: 'Rare', faction: 'Shadow', description: 'She circles the sky as daylight fades. Her cry is the last warning most travelers hear.' },
  { id: 36, name: 'Thorn Druid', rarity: 'Uncommon', faction: 'Nature', description: 'He tends brambles like sacred scripture. Intruders learn that every thorn has a purpose.' },
  { id: 37, name: 'Moss Guardian', rarity: 'Uncommon', faction: 'Nature', description: 'Patient as old stone and twice as stubborn. It wakes only when the grove is threatened.' },
  { id: 38, name: 'Vine Shaman', rarity: 'Uncommon', faction: 'Nature', description: 'She speaks in whispers to roots below the soil. The vines answer by tightening their grip.' },
  { id: 39, name: 'Wildroot Protector', rarity: 'Uncommon', faction: 'Nature', description: 'Its body is tangled with sacred roots. Cut one away, and three more rise in its place.' },
  { id: 40, name: 'Forest Tracker', rarity: 'Uncommon', faction: 'Nature', description: 'No trail stays hidden from its eyes. Even fallen leaves tell it where enemies have gone.' },
  { id: 41, name: 'Barkhide Warrior', rarity: 'Uncommon', faction: 'Nature', description: 'Enchanted bark covers his skin like armor. Axes bite shallow, but his spear strikes deep.' },
  { id: 42, name: 'Grove Mystic', rarity: 'Uncommon', faction: 'Nature', description: 'She listens to the old trees at dawn. Their secrets guide every spell she casts.' },
  { id: 43, name: 'Oak Sentinel', rarity: 'Uncommon', faction: 'Nature', description: 'Rooted in duty rather than soil. It has stood guard through storms, wars, and silence.' },
  { id: 44, name: 'Flame Adept', rarity: 'Uncommon', faction: 'Fire', description: 'A young fire mage with dangerous promise. Small sparks become disasters in his hands.' },
  { id: 45, name: 'Ember Scout', rarity: 'Uncommon', faction: 'Fire', description: 'She runs ahead of the flame clans. By the time smoke is seen, her message has already arrived.' },
  { id: 46, name: 'Ash Runner', rarity: 'Uncommon', faction: 'Fire', description: 'He crosses volcanic plains without slowing. Hot ash rises behind every step.' },
  { id: 47, name: 'Firebrand Soldier', rarity: 'Uncommon', faction: 'Fire', description: 'A reckless fighter carrying a burning standard. Courage spreads wherever his banner glows.' },
  { id: 48, name: 'Cinder Mage', rarity: 'Uncommon', faction: 'Fire', description: 'His spells do not explode, they linger. What he burns continues to smolder for days.' },
  { id: 49, name: 'Magma Hound', rarity: 'Uncommon', faction: 'Fire', description: 'Lava pulses beneath its cracked hide. It tracks prey by the warmth of their fear.' },
  { id: 50, name: 'Blaze Archer', rarity: 'Uncommon', faction: 'Fire', description: 'Her arrows ignite as they leave the string. Night battles become daylight wherever she aims.' },
  { id: 51, name: 'Lava Smith', rarity: 'Uncommon', faction: 'Fire', description: 'He hammers weapons over rivers of molten stone. Each blade remembers the heat of its birth.' },
  { id: 52, name: 'Tide Scout', rarity: 'Uncommon', faction: 'Water', description: 'He reads coastlines the way others read maps. No hidden inlet escapes his notice.' },
  { id: 53, name: 'Coral Priest', rarity: 'Uncommon', faction: 'Water', description: 'She blesses reefs with quiet songs. Wounded waters bloom again beneath her care.' },
  { id: 54, name: 'River Guardian', rarity: 'Uncommon', faction: 'Water', description: 'It stands where river paths narrow. Those who poison the water never cross twice.' },
  { id: 55, name: 'Sea Hunter', rarity: 'Uncommon', faction: 'Water', description: 'A patient tracker of waves and fins. He knows which ripples mean treasure and which mean teeth.' },
  { id: 56, name: 'Mist Caller', rarity: 'Uncommon', faction: 'Water', description: 'She lifts fog from cold water with a breath. Armies vanish when her veil rolls in.' },
  { id: 57, name: 'Wave Dancer', rarity: 'Uncommon', faction: 'Water', description: 'He fights with the rhythm of the tide. Every dodge feels like water slipping through fingers.' },
  { id: 58, name: 'Reef Protector', rarity: 'Uncommon', faction: 'Water', description: 'Its shield is carved from living coral. The reef grows stronger wherever it stands.' },
  { id: 59, name: 'Harbor Mystic', rarity: 'Uncommon', faction: 'Water', description: 'She reads omens in ropes, gulls, and tide foam. Dockworkers trust her warnings more than maps.' },
  { id: 60, name: 'Shade Assassin', rarity: 'Uncommon', faction: 'Shadow', description: 'He does not chase targets. He waits where their shadow will fall.' },
  { id: 61, name: 'Night Stalker', rarity: 'Uncommon', faction: 'Shadow', description: 'Its footsteps vanish in moonlight. Prey hear the breath before they see the claws.' },
  { id: 62, name: 'Dusk Hunter', rarity: 'Uncommon', faction: 'Shadow', description: 'She begins the hunt when the sun touches the horizon. Twilight hides every drawn blade.' },
  { id: 63, name: 'Void Cultist', rarity: 'Uncommon', faction: 'Shadow', description: 'He prays to the silence between stars. Sometimes the silence answers back.' },
  { id: 64, name: 'Shadow Monk', rarity: 'Uncommon', faction: 'Shadow', description: 'Discipline turned inward until only darkness remained. His strikes land before his body moves.' },
  { id: 65, name: 'Grave Walker', rarity: 'Uncommon', faction: 'Shadow', description: 'It wanders among tombstones without disturbing the dust. The dead seem calmer when it passes.' },
  { id: 66, name: 'Dark Scout', rarity: 'Uncommon', faction: 'Shadow', description: 'A spy trained to move where lanterns fail. He returns with secrets and no witnesses.' },
  { id: 67, name: 'Phantom Duelist', rarity: 'Uncommon', faction: 'Shadow', description: 'A ghostly swordsman bound to unfinished combat. Every challenger becomes part of his legend.' },
  { id: 68, name: 'Dawn Priest', rarity: 'Uncommon', faction: 'Light', description: 'He carries morning prayers into places that forgot the sun. Darkness retreats before his voice.' },
  { id: 69, name: 'Sun Guard', rarity: 'Uncommon', faction: 'Light', description: 'A temple defender sworn beneath golden banners. His shield shines brightest during hopeless battles.' },
  { id: 70, name: 'Light Archer', rarity: 'Uncommon', faction: 'Light', description: 'Her arrows leave trails of pale radiance. Creatures of shadow feel them before impact.' },
  { id: 71, name: 'Radiant Squire', rarity: 'Uncommon', faction: 'Light', description: 'Young, loyal, and eager to prove worthy. His courage often arrives before his armor does.' },
  { id: 72, name: 'Halo Monk', rarity: 'Uncommon', faction: 'Light', description: 'He fights with calm hands and a clear spirit. Each strike carries the weight of devotion.' },
  { id: 73, name: 'Beacon Keeper', rarity: 'Uncommon', faction: 'Light', description: 'She tends signal fires on sacred towers. Lost armies march home by her flame.' },
  { id: 74, name: 'Celestial Acolyte', rarity: 'Uncommon', faction: 'Light', description: 'A student of star-born magic. She traces constellations to shape her first spells.' },
  { id: 75, name: 'Goldwing Scout', rarity: 'Uncommon', faction: 'Light', description: 'Swift wings carry him over enemy lines. His golden feathers are signs of hope below.' },
  { id: 76, name: 'Young Druid', rarity: 'Common', faction: 'Nature', description: 'Still learning the language of leaves. The smallest sprout already bends toward her voice.' },
  { id: 77, name: 'Forest Scout', rarity: 'Common', faction: 'Nature', description: 'He watches the narrow woodland paths. A broken twig is enough to raise his alarm.' },
  { id: 78, name: 'Berry Gatherer', rarity: 'Common', faction: 'Nature', description: 'She knows which fruit heals and which fruit harms. Travelers survive winter because of her basket.' },
  { id: 79, name: 'Sapling Tender', rarity: 'Common', faction: 'Nature', description: 'He protects young trees from frost and fire. Someday, those saplings may protect him in return.' },
  { id: 80, name: 'Woodland Archer', rarity: 'Common', faction: 'Nature', description: 'A quiet hunter of the greenwood. His arrows fly clean between branches.' },
  { id: 81, name: 'Herb Collector', rarity: 'Common', faction: 'Nature', description: 'She searches damp hills for rare leaves. Her pouch smells of medicine, rain, and earth.' },
  { id: 82, name: 'Mushroom Picker', rarity: 'Common', faction: 'Nature', description: 'He knows the safe caps from the deadly ones. In the deep forest, that knowledge is power.' },
  { id: 83, name: 'River Forager', rarity: 'Common', faction: 'Nature', description: 'She gathers roots and reeds from shallow banks. Nothing useful escapes her practiced hands.' },
  { id: 84, name: 'Tree Climber', rarity: 'Common', faction: 'Nature', description: 'He moves through branches faster than roads. From above, the forest tells a wider story.' },
  { id: 85, name: 'Grove Keeper', rarity: 'Common', faction: 'Nature', description: 'She sweeps fallen leaves from sacred stones. Her quiet work keeps old magic awake.' },
  { id: 86, name: 'Rootbinder', rarity: 'Common', faction: 'Nature', description: 'He twists living roots into bridges and snares. Patience is his strongest tool.' },
  { id: 87, name: 'Woodland Sage', rarity: 'Common', faction: 'Nature', description: 'Old enough to remember when the forest was larger. Wise enough to mourn it in silence.' },
  { id: 88, name: 'Ivy Serpent', rarity: 'Common', faction: 'Nature', description: 'It coils among ruined walls and green shadows. By the time it moves, it already holds its prey.' },
  { id: 89, name: 'Emerald Beetle', rarity: 'Common', faction: 'Nature', description: 'Its shell glitters like polished jade. Children follow it hoping to find hidden groves.' },
  { id: 90, name: 'Wildfang Cougar', rarity: 'Common', faction: 'Nature', description: 'A swift predator of high branches and low grass. It attacks from places eyes forget to check.' },
  { id: 91, name: 'Camp Firekeeper', rarity: 'Common', faction: 'Fire', description: 'She guards the flame through wind and rain. A warm camp can save more lives than a sword.' },
  { id: 92, name: 'Coal Gatherer', rarity: 'Common', faction: 'Fire', description: 'His hands are blackened from honest work. Every furnace in the village depends on his load.' },
  { id: 93, name: 'Furnace Worker', rarity: 'Common', faction: 'Fire', description: 'He feeds the great fires before sunrise. The heat has made him tougher than he looks.' },
  { id: 94, name: 'Torch Runner', rarity: 'Common', faction: 'Fire', description: 'She carries light through dangerous streets. When torches vanish, panic follows.' },
  { id: 95, name: 'Ember Carrier', rarity: 'Common', faction: 'Fire', description: 'He transports sacred coals in a bronze pot. One spark can relight an entire town.' },
  { id: 96, name: 'Ash Gatherer', rarity: 'Common', faction: 'Fire', description: 'She collects ash from old rituals and battlefields. Mages pay well for what others sweep away.' },
  { id: 97, name: 'Firewood Cutter', rarity: 'Common', faction: 'Fire', description: 'His axe falls in steady rhythm. Winter fears the stack outside his door.' },
  { id: 98, name: 'Kiln Worker', rarity: 'Common', faction: 'Fire', description: 'She bakes clay into bricks strong enough for city walls. Her craft begins where mud meets flame.' },
  { id: 99, name: 'Village Smith', rarity: 'Common', faction: 'Fire', description: 'He shapes horseshoes, nails, and humble blades. Every hero begins with someone else\'s hammer.' },
  { id: 100, name: 'Scorch Rider', rarity: 'Common', faction: 'Fire', description: 'He rides across blackened plains on a heat-trained mount. Smoke follows like a banner.' },
  { id: 101, name: 'Pyro Monk', rarity: 'Common', faction: 'Fire', description: 'He meditates beside open flame. Discipline keeps the fire in his hands from reaching his heart.' },
  { id: 102, name: 'Cinder Wolf', rarity: 'Common', faction: 'Fire', description: 'Its paws leave warm prints in cold ash. Packs gather wherever old fires die.' },
  { id: 103, name: 'Flamecaller', rarity: 'Common', faction: 'Fire', description: 'She whispers to campfires and candles. Sometimes the smallest flame gives the loudest answer.' },
  { id: 104, name: 'Magma Brute', rarity: 'Common', faction: 'Fire', description: 'Slow, heavy, and burning from within. It does not need speed when everything must move aside.' },
  { id: 105, name: 'Fisherman', rarity: 'Common', faction: 'Water', description: 'He casts his net before dawn. The sea rewards patience and punishes pride.' },
  { id: 106, name: 'Harbor Worker', rarity: 'Common', faction: 'Water', description: 'She hauls ropes, crates, and rumors from every arriving ship. Nothing docks without her noticing.' },
  { id: 107, name: 'Net Caster', rarity: 'Common', faction: 'Water', description: 'His hands move faster than fleeing fish. A good throw can feed a family for days.' },
  { id: 108, name: 'Dock Watcher', rarity: 'Common', faction: 'Water', description: 'He keeps his lantern high over the piers. Smugglers hate his patience most of all.' },
  { id: 109, name: 'River Trader', rarity: 'Common', faction: 'Water', description: 'She follows currents from village to village. Her boat carries salt, stories, and bargains.' },
  { id: 110, name: 'Boat Builder', rarity: 'Common', faction: 'Water', description: 'He knows the shape of wood that wants to float. His best vessels feel alive beneath the oar.' },
  { id: 111, name: 'Pearl Diver', rarity: 'Common', faction: 'Water', description: 'She dives where sunlight turns blue and thin. Each pearl is paid for with a held breath.' },
  { id: 112, name: 'Sailor', rarity: 'Common', faction: 'Water', description: 'He trusts rope, wind, and instinct. Land feels stranger to him than storms.' },
  { id: 113, name: 'Tide Gatherer', rarity: 'Common', faction: 'Water', description: 'She harvests what the low tide reveals. Shells, herbs, and secrets all wash ashore.' },
  { id: 114, name: 'Icefin Shark', rarity: 'Common', faction: 'Water', description: 'A cold-water hunter with glassy eyes. Its fin cuts through mist before the body appears.' },
  { id: 115, name: 'Storm Sailor', rarity: 'Common', faction: 'Water', description: 'He laughs when thunder rolls overhead. Calm seas, he says, make lazy crews.' },
  { id: 116, name: 'Ocean Warden', rarity: 'Common', faction: 'Water', description: 'She watches the deep borders of the bay. Some things beneath the waves should remain beneath.' },
  { id: 117, name: 'Coral Knight', rarity: 'Common', faction: 'Water', description: 'His armor grows slowly, layer by layer. The reef has claimed him as its own defender.' },
  { id: 118, name: 'Tundra Spirit', rarity: 'Common', faction: 'Water', description: 'A pale figure drifting across frozen plains. It appears when travelers begin to lose hope.' },
  { id: 119, name: 'Alley Sneak', rarity: 'Common', faction: 'Shadow', description: 'He survives by knowing which streets forget the sun. Coins and secrets disappear in his wake.' },
  { id: 120, name: 'Night Watcher', rarity: 'Common', faction: 'Shadow', description: 'She keeps her eyes open while others dream. Not every threat waits outside the walls.' },
  { id: 121, name: 'Cave Lurker', rarity: 'Common', faction: 'Shadow', description: 'It clings to ceilings where torchlight fails. Echoes often warn too late.' },
  { id: 122, name: 'Grave Tender', rarity: 'Common', faction: 'Shadow', description: 'He cleans old stones and remembers old names. The restless dead leave him in peace.' },
  { id: 123, name: 'Shadow Runner', rarity: 'Common', faction: 'Shadow', description: 'She carries messages through alleys and moonless fields. No seal is safe in the dark.' },
  { id: 124, name: 'Dark Messenger', rarity: 'Common', faction: 'Shadow', description: 'He delivers words nobody wants to hear. His arrival makes candles flicker low.' },
  { id: 125, name: 'Crypt Worker', rarity: 'Common', faction: 'Shadow', description: 'She repairs doors no living soul should open. Her tools are iron, salt, and nerve.' },
  { id: 126, name: 'Moonlit Scout', rarity: 'Common', faction: 'Shadow', description: 'He travels only under pale moonlight. His reports arrive before the owls return.' },
  { id: 127, name: 'Dusk Wanderer', rarity: 'Common', faction: 'Shadow', description: 'A cloaked figure seen at the edge of roads. It never asks for directions, only silence.' },
  { id: 128, name: 'Crypt Keeper', rarity: 'Common', faction: 'Shadow', description: 'He holds keys to chambers below the chapel. Some doors are locked to protect both sides.' },
  { id: 129, name: 'Doom Raven', rarity: 'Common', faction: 'Shadow', description: 'Its black wings gather over failing armies. Soldiers call it bad luck, but it only arrives on time.' },
  { id: 130, name: 'Bone Servant', rarity: 'Common', faction: 'Shadow', description: 'A simple skeleton bound to old commands. It works without hunger, fear, or rest.' },
  { id: 131, name: 'Wraithling', rarity: 'Common', faction: 'Shadow', description: 'A small spirit trailing cold air behind it. Children mistake its glow for a lost firefly.' },
  { id: 132, name: 'Temple Guard', rarity: 'Common', faction: 'Light', description: 'He stands beneath carved pillars from sunrise to sunset. Faith has made his posture unbreakable.' },
  { id: 133, name: 'Shrine Keeper', rarity: 'Common', faction: 'Light', description: 'She dusts relics and replaces candles before dawn. Small rituals keep great blessings alive.' },
  { id: 134, name: 'Dawn Messenger', rarity: 'Common', faction: 'Light', description: 'He runs with the first light across the hills. Good news travels faster in his hands.' },
  { id: 135, name: 'Lantern Bearer', rarity: 'Common', faction: 'Light', description: 'She carries a holy lantern through unsafe roads. Shadows bend away from its steady glow.' },
  { id: 136, name: 'Pilgrim', rarity: 'Common', faction: 'Light', description: 'He walks barefoot toward a distant sacred city. Every blister becomes part of his prayer.' },
  { id: 137, name: 'Choir Acolyte', rarity: 'Common', faction: 'Light', description: 'Her voice is young but steady. In battle, even a hymn can hold fear at bay.' },
  { id: 138, name: 'Chapel Caretaker', rarity: 'Common', faction: 'Light', description: 'He mends benches, bells, and broken spirits. The chapel stays open because of him.' },
  { id: 139, name: 'Light Disciple', rarity: 'Common', faction: 'Light', description: 'She studies beneath stained glass windows. Her first blessing is small, but sincere.' },
  { id: 140, name: 'Sacred Attendant', rarity: 'Common', faction: 'Light', description: 'He prepares robes, oils, and ceremonial blades. Great rites depend on careful hands.' },
  { id: 141, name: 'Lumina Spirit', rarity: 'Common', faction: 'Light', description: 'A gentle glow floating above old roads. Lost travelers follow it without knowing why.' },
  { id: 142, name: 'Star Priestess', rarity: 'Common', faction: 'Light', description: 'She reads quiet omens in the evening sky. Her prophecies arrive softly but strike deeply.' },
  { id: 143, name: 'Beacon Novice', rarity: 'Common', faction: 'Light', description: 'He tends small signal flames along the coast. Someday, his light may guide a fleet home.' },
  { id: 144, name: 'Aurora Mage', rarity: 'Common', faction: 'Light', description: 'She paints shields of color across the night. Her magic shines best in the cold.' },
  { id: 145, name: 'Apprentice Engineer', rarity: 'Common', faction: 'Iron', description: 'He sketches machines in the margins of every lesson. Most fail, but each failure teaches loudly.' },
  { id: 146, name: 'Forge Apprentice', rarity: 'Common', faction: 'Iron', description: 'She carries tongs too large for her hands. One day the forge will answer to her hammer.' },
  { id: 147, name: 'Iron Miner', rarity: 'Common', faction: 'Iron', description: 'He digs where the mountain sounds hollow. Steel begins in darkness beneath his boots.' },
  { id: 148, name: 'Stone Mason', rarity: 'Common', faction: 'Iron', description: 'Her blocks fit so tightly that rain cannot find the seams. Cities rise one patient cut at a time.' },
  { id: 149, name: 'Gear Worker', rarity: 'Common', faction: 'Iron', description: 'He cleans and sets teeth into brass wheels. A single misplaced gear can halt a kingdom.' },
  { id: 150, name: 'Metal Carrier', rarity: 'Common', faction: 'Iron', description: 'She hauls ingots from furnace to workshop. Strength is built before weapons are forged.' },
]

function imageUrl(name: string, faction: string): string {
  const colors = FACTION_COLORS[faction] ?? { bg: '1a1a2e', fg: 'ffffff' }
  const text = encodeURIComponent(name)
  return `https://placehold.co/400x560/${colors.bg}/${colors.fg}?text=${text}&font=montserrat`
}

async function main() {
  console.log('Importing 150 cards…')

  for (const c of csvCards) {
    const rarity = RARITY_MAP[c.rarity]
    if (!rarity) { console.warn(`Unknown rarity: ${c.rarity} for ${c.name}`); continue }

    await prisma.card.upsert({
      where: { id: `csv-${c.id}` },
      update: {
        name: c.name,
        rarity,
        category: c.faction,
        description: c.description,
        imageUrl: imageUrl(c.name, c.faction),
        isActive: true,
      },
      create: {
        id: `csv-${c.id}`,
        name: c.name,
        rarity,
        category: c.faction,
        description: c.description,
        imageUrl: imageUrl(c.name, c.faction),
        isActive: true,
      },
    })
    console.log(`  ✓ [${c.rarity.padEnd(9)}] ${c.name} (${c.faction})`)
  }

  // Add all new cards to every existing pack that doesn't already have them
  const allPacks = await prisma.pack.findMany({ include: { slots: { select: { cardId: true } } } })
  for (const pack of allPacks) {
    const existingCardIds = new Set(pack.slots.map((s) => s.cardId))
    const newSlots = csvCards
      .map((c) => ({ id: `csv-${c.id}`, rarity: c.rarity }))
      .filter((c) => !existingCardIds.has(c.id))
      .map((c) => ({
        packId: pack.id,
        cardId: c.id,
        weight: RARITY_WEIGHTS[RARITY_MAP[c.rarity]] ?? 10,
      }))

    if (newSlots.length > 0) {
      await prisma.packSlot.createMany({ data: newSlots, skipDuplicates: true })
      console.log(`\n  ✓ Added ${newSlots.length} new card slots to pack "${pack.name}"`)
    }
  }

  console.log('\n✅ Done — 150 cards imported.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
