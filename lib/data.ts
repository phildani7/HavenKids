// =============================================================
// HAVEN KIDS — seed data (expanded)
// =============================================================

export type ColorKey = 'gold' | 'coral' | 'sky' | 'grass' | 'grape' | 'rose';

export interface Community {
  id: string;
  name: string;
  emoji: string;
  color: ColorKey;
  members: number;
  posts: number;
  blurb: string;
  cover: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  age: number;
  level: number;
  xp: number;
  badges: string[];
  color: ColorKey;
}

export interface Reactions {
  praise: number;
  amen: number;
  heart: number;
  wow: number;
}

export interface Post {
  id: string;
  community: string;
  user: User;
  time: string;
  title: string;
  body: string;
  reactions: Reactions;
  comments: number;
  pinned?: boolean;
  image?: 'ark' | 'rainbow' | 'dog';
  angelNote?: string;
}

export interface Verse {
  ref: string;
  text: string;
  theme: string;
}

export interface EventItem {
  id: string;
  day: string;
  date: number;
  title: string;
  time: string;
  community: string;
}

export interface LessonStep {
  kind: 'read' | 'reflect' | 'do' | 'verse' | 'quiz';
  title: string;
  body: string;
  verseRef?: string;
  options?: string[];
  answer?: number;
}

export interface Lesson {
  id: string;
  community: string;
  title: string;
  lessons: number;
  progress: number;
  color: ColorKey;
  thumb: string;
  description: string;
  steps: LessonStep[];
}

export interface BadgeDef {
  id: string;
  name: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  earned: boolean;
  desc: string;
}

export interface LeaderboardEntry extends User {
  rank: number;
  weekXp: number;
}

export interface PrayerRequest {
  id: string;
  user: User;
  time: string;
  text: string;
  prayers: number;
  answered?: boolean;
  justPrayed?: boolean;
}

export interface ChatMessageSeed {
  id: number;
  name: string;
  avatar: string;
  color: ColorKey;
  text: string;
  time: string;
  isAngel?: boolean;
}

export interface NotificationItem {
  id: string;
  icon: string;
  title: string;
  body: string;
  time: string;
  color: ColorKey;
}

export interface ParentActivity {
  icon: string;
  label: string;
  time: string;
  kind: 'positive' | 'neutral' | 'warn';
}

const communities: Community[] = [
  { id: 'bible',   name: 'Bible Buddies',      emoji: '📖', color: 'gold',  members: 2840, posts: 1842, blurb: 'Stories, verses & wonder from the Word.', cover: 'linear-gradient(135deg,#FFE9A8,#FFC94A)' },
  { id: 'art',     name: 'Art Angels',         emoji: '🎨', color: 'coral', members: 1993, posts: 3211, blurb: 'Doodle, paint & share God-given creativity.', cover: 'linear-gradient(135deg,#FFC1B6,#FF7E6B)' },
  { id: 'worship', name: 'Worship Warriors',   emoji: '🎤', color: 'grape', members: 1520, posts: 812,  blurb: 'Songs, hymns, and joyful noises.', cover: 'linear-gradient(135deg,#D7B8F5,#B47EE5)' },
  { id: 'science', name: 'Creation Explorers', emoji: '🔭', color: 'sky',   members: 1106, posts: 644,  blurb: 'Discover how wonderfully we are made.', cover: 'linear-gradient(135deg,#B5E2F9,#7AC7F2)' },
  { id: 'home',    name: 'Homeschool Hangout', emoji: '🏠', color: 'grass', members: 3210, posts: 5020, blurb: 'Study buddies & school-day cheer.', cover: 'linear-gradient(135deg,#C7ECC9,#7DCE82)' },
  { id: 'book',    name: 'Book Nook',          emoji: '📚', color: 'sky',   members: 872,  posts: 442,  blurb: 'Stories, reviews & reading streaks.', cover: 'linear-gradient(135deg,#E0CBFA,#B47EE5)' },
  { id: 'code',    name: 'Code for Christ',    emoji: '💻', color: 'grape', members: 612,  posts: 288,  blurb: 'Build things with love & logic.', cover: 'linear-gradient(135deg,#A7D6F5,#4FA6D9)' },
  { id: 'sports',  name: 'Sports & Praise',    emoji: '⚽', color: 'grass', members: 1420, posts: 900,  blurb: 'Play hard, cheer loud, thank God.', cover: 'linear-gradient(135deg,#C7ECC9,#4FB058)' },
  { id: 'prayer',  name: 'Prayer Pals',        emoji: '🙏', color: 'coral', members: 2010, posts: 1330, blurb: 'Lift each other up every single day.', cover: 'linear-gradient(135deg,#FFC1B6,#E85C47)' },
  { id: 'pets',    name: 'Pet Parables',       emoji: '🐶', color: 'gold',  members: 980,  posts: 2100, blurb: 'Furry, feathered & fishy friends.', cover: 'linear-gradient(135deg,#FFE9A8,#E8A825)' },
  { id: 'bake',    name: 'Kitchen Blessings',  emoji: '🧁', color: 'rose',  members: 740,  posts: 602,  blurb: 'Baking, cooking & thankful hearts.', cover: 'linear-gradient(135deg,#FFD1E1,#F58BB3)' },
  { id: 'outdoor', name: 'Trail Trekkers',     emoji: '🌲', color: 'grass', members: 430,  posts: 210,  blurb: 'Hiking, camping & creation walks.', cover: 'linear-gradient(135deg,#B8E6BE,#4FB058)' },
];

const avatars = [
  '🦄','🐻','🐰','🦊','🐼','🦁','🐸','🐨','🐯','🦉','🐥','🦒','🐵','🐢','🐙','🦋','🐞','🐳','🐝','🦕','🐻‍❄️','🐿️','🦔','🐺',
];

const names = [
  'Lily','Noah','Ezra','Maya','Caleb','Ruth','Jonah','Abby','Micah','Grace','Eli','Naomi','Asher','Hannah','Silas','Zoe','Levi','Ivy','Moses','Esther','Judah','Ada','Gideon','Tessa','Isaac','Mara',
];

const colors: ColorKey[] = ['gold','coral','sky','grass','grape','rose'];

function mkUser(i: number, age = 10): User {
  return {
    id: 'u' + i,
    name: names[i % names.length] + (i > names.length - 1 ? ' ' + String.fromCharCode(65 + (i % 26)) : ''),
    avatar: avatars[i % avatars.length],
    age,
    level: 1 + ((i * 3) % 20),
    xp: (i * 73) % 950,
    badges: ['kind', 'scripture', 'helper'].slice(0, (i % 3) + 1),
    color: colors[i % colors.length],
  };
}

const users: User[] = Array.from({ length: 24 }, (_, i) => mkUser(i, 7 + (i % 12)));

// Small helper to keep the post list readable
const post = (
  id: string,
  community: string,
  userIdx: number,
  time: string,
  title: string,
  body: string,
  r: Partial<Reactions>,
  comments: number,
  extra: Partial<Post> = {}
): Post => ({
  id,
  community,
  user: users[userIdx],
  time,
  title,
  body,
  reactions: { praise: 0, amen: 0, heart: 0, wow: 0, ...r },
  comments,
  ...extra,
});

const feed: Post[] = [
  // --- Bible Buddies ---
  post('p1', 'bible', 2, '2 min ago', "Noah's Ark in LEGO!", "Took me 3 days but I finished building Noah's ark! Every animal in pairs 🐘🐘. What should I build next? Maybe Daniel in the lion's den?", { praise: 18, amen: 9, heart: 42, wow: 11 }, 14, { pinned: true, image: 'ark' }),
  post('p1b','bible', 9, '20 min ago', "Memorized Psalm 23 today 🎉", "Mom made me a little sticker chart and today I got the LAST sticker. Want to hear me say it on the worship night?", { praise: 44, amen: 22, heart: 60, wow: 4 }, 19),
  post('p1c','bible', 15, '1 hr ago', "Which is your favorite parable?", "Mine is the Prodigal Son because the dad runs. I can't stop thinking about it.", { praise: 9, amen: 8, heart: 31, wow: 2 }, 28),
  post('p1d','bible', 20, '3 hr ago', "Fun fact about Jonah 🐟", "The word for 'great fish' is 'dag gadol' — it just means BIG. It doesn't say whale! Anyway I made this comic.", { praise: 6, amen: 2, heart: 40, wow: 15 }, 11),
  post('p1e','bible', 7, '1 day ago', "Sword drill tomorrow 📖", "Who's joining the live Bible sword drill? 7pm. I'm nervous but Gabriel said it's okay to be.", { praise: 4, amen: 10, heart: 22, wow: 1 }, 13),

  // --- Art Angels ---
  post('p3', 'art', 8, '1 hr ago', 'Rainbow promise doodle ✨', 'Made this in the group doodle today with Ezra and Mara! Genesis 9 is my favorite.', { praise: 12, amen: 3, heart: 77, wow: 22 }, 9, { image: 'rainbow' }),
  post('p3b','art', 3, '3 hr ago', "I painted Jesus walking on water 🌊", "Used my new watercolors. The water turned out REALLY hard. Gabriel gave me a tip about salt.", { praise: 8, amen: 1, heart: 54, wow: 19 }, 14),
  post('p3c','art', 17, '6 hr ago', 'Open canvas: Garden of Eden 🌳', "Anyone want to collab? I started the trees — plenty of room for lions, rabbits, fruit, ALL the animals.", { praise: 6, amen: 0, heart: 38, wow: 5 }, 22),
  post('p3d','art', 21, '1 day ago', "Clay dove 🕊️", "Baked it in our oven. My little brother said it looks like a potato. RUDE. Shared anyway.", { praise: 2, amen: 0, heart: 88, wow: 12 }, 27),
  post('p3e','art', 12, '2 days ago', "Calligraphy verse cards", "I've been making these for my grandma's nursing home. If you want one mailed, ask a parent to DM Gabriel.", { praise: 40, amen: 18, heart: 101, wow: 8 }, 34),

  // --- Worship Warriors ---
  post('p5', 'worship', 11, '5 hr ago', 'Learning "10,000 Reasons" on ukulele', 'Took me a whole week to get the chords but I did it! Who wants to do a group jam session this Saturday?', { praise: 30, amen: 12, heart: 44, wow: 6 }, 17),
  post('p5b','worship', 18, '8 hr ago', "Wrote my first worship song 🎶", "It's called 'Small and Loved'. Only 12 lines. Can I sing it on the Friday night?", { praise: 55, amen: 31, heart: 88, wow: 9 }, 41),
  post('p5c','worship', 4, '1 day ago', "Drum kit tips?", "My uncle gave me an old drum kit. My foot keeps forgetting the kick. Any drummers here??", { praise: 3, amen: 0, heart: 14, wow: 2 }, 9),
  post('p5d','worship', 23, '2 days ago', "Scripture melodies thread", "Drop your favorite memory-verse song below. I'll make a playlist.", { praise: 12, amen: 20, heart: 33, wow: 1 }, 56),

  // --- Creation Explorers ---
  post('p4', 'science', 1, '3 hr ago', 'Did you know? Honeybees dance', 'They do a "waggle dance" to tell friends where flowers are. God made them tiny engineers 🐝. I wrote a little report, see pic!', { praise: 8, amen: 5, heart: 28, wow: 41 }, 6),
  post('p4b','science', 6, '7 hr ago', "Made a volcano 🌋 (erupted on dad)", "Baking soda + vinegar + food coloring. We did it OUTSIDE after. God made chemistry so fun.", { praise: 4, amen: 1, heart: 66, wow: 30 }, 19),
  post('p4c','science', 14, '1 day ago', "Stars visible tonight in my city", "Orion is RIGHT THERE. Also the moon is a perfect crescent. Is anyone else looking up tonight?", { praise: 2, amen: 8, heart: 21, wow: 19 }, 11),
  post('p4d','science', 22, '2 days ago', "Built a paper glider that flies 10m", "Folded it 47 times. I read in a book that 'fearfully and wonderfully' applies to paper too :)", { praise: 7, amen: 3, heart: 29, wow: 12 }, 7),

  // --- Homeschool Hangout ---
  post('p6', 'home', 4, '1 day ago', 'Math got me today 😅', 'Long division was BRUTAL. But I got through it. Anyone else doing fractions this week?', { praise: 3, amen: 1, heart: 18, wow: 2 }, 22),
  post('p6b','home', 10, '1 day ago', "Co-op is starting Monday!", "Who else is joining the Tuesday science group? We're dissecting flowers (don't worry, just petals).", { praise: 9, amen: 2, heart: 34, wow: 0 }, 14),
  post('p6c','home', 16, '2 days ago', "Cursive is FINALLY clicking", "Took me a month. I did a full page without picking up my pencil.", { praise: 5, amen: 3, heart: 27, wow: 11 }, 8),
  post('p6d','home', 19, '3 days ago', "Book sale @ library Saturday 📚", "Our family found 12 chapter books for $3. Mom cried a little (happy tears).", { praise: 2, amen: 1, heart: 20, wow: 0 }, 5),

  // --- Book Nook ---
  post('p8', 'book', 13, '4 hr ago', "Narnia reread club — who's in?", "One chapter a day out loud with family. I'll post reflection prompts.", { praise: 14, amen: 6, heart: 31, wow: 3 }, 22),
  post('p8b','book', 7, '1 day ago', "The Action Bible is so GOOD", "It's a comic book version. My little sister FINALLY wants to read Bible stories. Win.", { praise: 22, amen: 14, heart: 40, wow: 5 }, 12),
  post('p8c','book', 21, '2 days ago', "Review: 'Hinds' Feet on High Places'", "Harder than I expected. Gabriel explained 'much-afraid' and it made me cry.", { praise: 4, amen: 6, heart: 18, wow: 2 }, 7),

  // --- Code for Christ ---
  post('p9', 'code', 12, '2 hr ago', "Made a Scripture-of-the-day website!", "It uses a free API and my mom approved the verse list. My first real project!", { praise: 19, amen: 5, heart: 42, wow: 30 }, 24),
  post('p9b','code', 17, '8 hr ago', "How do loops work? Help", "I'm stuck on a bug where my 'for' loop runs one extra time. I'll paste the code in comments.", { praise: 1, amen: 0, heart: 12, wow: 4 }, 18),
  post('p9c','code', 2, '1 day ago', "Making a chores app for my family", "If you finish chores you get a sticker. Gabriel suggested kindness chores too — like making tea for mom.", { praise: 14, amen: 11, heart: 33, wow: 8 }, 13),

  // --- Sports & Praise ---
  post('p10','sports', 0, '5 hr ago', "Soccer practice tonight ⚽", "We start with a verse and finish with cookies. It's the best.", { praise: 8, amen: 5, heart: 30, wow: 1 }, 11),
  post('p10b','sports', 20, '1 day ago', "Ran my first mile without stopping", "12 minutes, 18 seconds. Not fast but I did NOT walk.", { praise: 25, amen: 9, heart: 60, wow: 8 }, 19),
  post('p10c','sports', 11, '2 days ago', "Team devotionals ideas?", "Our coach asked me to lead the pre-game devo Friday. 5 minutes. Short verse ideas welcome.", { praise: 7, amen: 15, heart: 22, wow: 2 }, 30),

  // --- Prayer Pals ---
  post('p2', 'prayer', 5, '18 min ago', 'Please pray for my grandma', "She is going into surgery tomorrow morning. I know God is with her but I'm a little scared. Would you all pray? 🙏", { praise: 4, amen: 86, heart: 54, wow: 0 }, 31, { angelNote: "Gabriel lit a candle for Miriam's grandma." }),
  post('p2b','prayer', 16, '2 hr ago', "Prayed and it happened 💛", "The thing I posted about last week? DONE. God showed up. Just wanted to say thank you to everyone who prayed.", { praise: 31, amen: 55, heart: 90, wow: 7 }, 22),
  post('p2c','prayer', 13, '6 hr ago', "New kid at school", "There's a new kid this week. He sits alone. I asked Gabriel for a good first-hello line.", { praise: 12, amen: 18, heart: 48, wow: 3 }, 17),

  // --- Pet Parables ---
  post('p7', 'pets', 14, '1 day ago', 'Meet Biscuit 🐶', 'He is 6 months old and the best boy. We named him Biscuit because he loves biscuits (obviously).', { praise: 2, amen: 0, heart: 120, wow: 14 }, 40, { image: 'dog' }),
  post('p7b','pets', 3, '2 days ago', "My cat preaches 🐱", "When I read out loud she SITS and LISTENS. My sister says she's just warm. I know the truth.", { praise: 3, amen: 1, heart: 70, wow: 22 }, 18),
  post('p7c','pets', 18, '3 days ago', "Goldfish named Goliath — update", "He's still tiny. The name did not help.", { praise: 4, amen: 0, heart: 50, wow: 9 }, 12),

  // --- Kitchen Blessings ---
  post('p11','bake', 23, '2 hr ago', "Homemade communion bread 🍞", "Our family makes it every Sunday. Recipe in the comments. It's 4 ingredients.", { praise: 18, amen: 14, heart: 60, wow: 8 }, 25),
  post('p11b','bake', 10, '1 day ago', "Fails happen. Exhibit A.", "My cinnamon rolls deflated. They taste fine! Just… flat. God loves flat rolls too.", { praise: 2, amen: 0, heart: 44, wow: 5 }, 14),
  post('p11c','bake', 15, '2 days ago', "Meal for a sick neighbor", "We made soup. I wrote a verse on the lid. Mrs. Kim texted me a smiling face 😊.", { praise: 22, amen: 12, heart: 70, wow: 1 }, 9),

  // --- Trail Trekkers ---
  post('p12','outdoor', 6, '9 hr ago', "Full-moon family hike 🌕", "We did the short loop and saw a DEER. Creation is wild.", { praise: 6, amen: 4, heart: 28, wow: 20 }, 7),
  post('p12b','outdoor', 19, '2 days ago', "My first fire (safely!)", "Dad taught me. One match. Smoked the chicken dinner.", { praise: 5, amen: 2, heart: 40, wow: 12 }, 10),
];

const verse: Verse = {
  ref: 'Psalm 139:14',
  text: 'I praise you because I am fearfully and wonderfully made; your works are wonderful, I know that full well.',
  theme: 'Wonder',
};

const events: EventItem[] = [
  { id: 'e1',  day: 'Fri', date: 26, title: 'Virtual Worship Night',         time: '7:00 PM',  community: 'worship' },
  { id: 'e2',  day: 'Sat', date: 27, title: 'Group Doodle — Garden of Eden', time: '10:00 AM', community: 'art' },
  { id: 'e3',  day: 'Sun', date: 28, title: 'Scripture Scavenger Hunt',      time: '2:00 PM',  community: 'bible' },
  { id: 'e4',  day: 'Mon', date: 29, title: 'Homeschool Co-op Chat',         time: '9:00 AM',  community: 'home' },
  { id: 'e5',  day: 'Tue', date: 30, title: 'Prayer Circle Live',            time: '7:30 PM',  community: 'prayer' },
  { id: 'e6',  day: 'Wed', date: 1,  title: 'Code Jam: Build a Verse App',   time: '4:00 PM',  community: 'code' },
  { id: 'e7',  day: 'Thu', date: 2,  title: 'Pet Show & Tell',               time: '5:00 PM',  community: 'pets' },
  { id: 'e8',  day: 'Fri', date: 3,  title: 'Bake-Together: Communion Bread',time: '10:00 AM', community: 'bake' },
  { id: 'e9',  day: 'Sat', date: 4,  title: 'Creation Walk @ Local Park',    time: '9:00 AM',  community: 'outdoor' },
  { id: 'e10', day: 'Sun', date: 5,  title: 'Book Club: Narnia Chapter 4',   time: '6:00 PM',  community: 'book' },
  { id: 'e11', day: 'Mon', date: 6,  title: 'Soccer Devo + Practice',        time: '5:30 PM',  community: 'sports' },
  { id: 'e12', day: 'Wed', date: 8,  title: 'Drum Circle Zoom',              time: '4:30 PM',  community: 'worship' },
  { id: 'e13', day: 'Fri', date: 10, title: 'Art Angels Gallery Night',      time: '7:00 PM',  community: 'art' },
];

const step = (s: LessonStep): LessonStep => s;

const classroom: Lesson[] = [
  {
    id: 'c1', community: 'bible', title: 'Bible 101 for Kids', lessons: 12, progress: 0.75, color: 'gold', thumb: '📖',
    description: 'A gentle tour of the Bible — who wrote it, what it is, and why kids love it.',
    steps: [
      step({ kind:'read',    title:'What IS the Bible?', body:"The Bible is a library of 66 books written across ~1500 years by 40+ people — and one big message: God loves you and wants to be your friend forever." }),
      step({ kind:'verse',   title:"Today's memory verse", body:'Write it on an index card. Say it 3 times out loud.', verseRef:'Psalm 119:105' }),
      step({ kind:'reflect', title:'Think about it', body:"If the Bible is a 'lamp to my feet', what choice this week needs a little lamp-light?" }),
      step({ kind:'do',      title:'Tiny doable thing', body:'Open a Bible (paper or app) and pick ONE verse you love. Snap a photo and share it in Bible Buddies.' }),
      step({ kind:'quiz',    title:'Quick check', body:'How many books are in the Bible?', options:['40','66','100','7'], answer:1 }),
    ],
  },
  {
    id: 'c2', community: 'art', title: 'Draw Bible Stories', lessons: 8, progress: 0.40, color: 'coral', thumb: '🎨',
    description: 'Step-by-step drawing lessons for your favorite Bible moments.',
    steps: [
      step({ kind:'read',    title:"Today's scene: the burning bush 🔥", body:"Moses meets God in a bush that is on fire but NOT burning up. That's our scene." }),
      step({ kind:'do',      title:'Warm up', body:'Sketch 3 bushes. Then 3 flames. Keep them LOOSE.' }),
      step({ kind:'do',      title:'Combine + color', body:'Draw one bush with flames wrapping around. Use yellow, orange, red — and a touch of PURPLE for a glow.' }),
      step({ kind:'reflect', title:'What does it mean?', body:"God shows up in surprising ways. Where did you notice God this week?" }),
    ],
  },
  {
    id: 'c3', community: 'prayer', title: 'Prayer Journal Basics', lessons: 6, progress: 1.0, color: 'grape', thumb: '📓',
    description: 'A cozy 6-lesson intro to writing prayers in a journal.',
    steps: [
      step({ kind:'read', title:'P.R.A.Y. format', body:'Praise → Repent → Ask → Yield. Four short lines make a full prayer.' }),
      step({ kind:'do', title:'Try it', body:'Write one line for each letter. No one sees but God.' }),
      step({ kind:'verse', title:'Verse to pray back', body:'Speak this verse as if God were right next to you.', verseRef:'Philippians 4:6-7' }),
    ],
  },
  {
    id: 'c4', community: 'worship', title: "Kid's Ukulele Worship", lessons: 10, progress: 0.10, color: 'grass', thumb: '🎸',
    description: 'Chord shapes and strum patterns with one-song-per-lesson.',
    steps: [
      step({ kind:'read', title:'Meet C, F, and G', body:'Three chords → 100+ worship songs. Look at the shape diagrams.' }),
      step({ kind:'do', title:'Slow strum', body:"Down, down, up, up, down. Eight bars. Don't speed up 😊." }),
      step({ kind:'reflect', title:'Who would you play this for?', body:'Could be a sibling, a grandparent, or just the living room wall.' }),
    ],
  },
  {
    id: 'c5', community: 'science', title: 'Wonder Lab: 6 Experiments', lessons: 6, progress: 0.33, color: 'sky', thumb: '🧪',
    description: 'Kitchen-safe experiments that point to a Creator.',
    steps: [
      step({ kind:'read', title:'Density tower', body:'Honey, syrup, soap, water, oil, alcohol — each rests on the one below. Hands off until a grown-up is around.' }),
      step({ kind:'do', title:'Build it', body:'Pour slowly down the side of a glass. Measure 2 tablespoons of each.' }),
      step({ kind:'reflect', title:'What did you notice?', body:'Why do some liquids stack and others mix? Write one sentence.' }),
    ],
  },
  {
    id: 'c6', community: 'code', title: 'Scripture API in 30 minutes', lessons: 5, progress: 0.0, color: 'grape', thumb: '💻',
    description: 'Tiny web app that fetches a verse. HTML, CSS, JS.',
    steps: [
      step({ kind:'read', title:'What is an API?', body:'A waiter you can talk to. You order JSON, it brings JSON.' }),
      step({ kind:'do', title:"Type this fetch", body:"fetch('https://bible-api.com/john+3:16').then(r => r.json())" }),
      step({ kind:'quiz', title:'Quick check', body:'What does fetch return?', options:['A string','A Promise','A number','A hug'], answer:1 }),
    ],
  },
  {
    id: 'c7', community: 'book', title: 'Narnia Reader Guide', lessons: 7, progress: 0.57, color: 'sky', thumb: '🦁',
    description: 'One chapter a week with reflection questions.',
    steps: [
      step({ kind:'read', title:'Chapter 3 — Edmund and the Turkish Delight', body:'Notice how each bite makes him want more. What do we "eat" that makes us want more in a bad way?' }),
      step({ kind:'reflect', title:'Think', body:"Who is your Tumnus — a brave friend who risks a little to help?" }),
    ],
  },
  {
    id: 'c8', community: 'home', title: 'Study Rhythm for Kids', lessons: 4, progress: 0.25, color: 'grass', thumb: '🗓️',
    description: 'Build a kind, doable daily study plan.',
    steps: [
      step({ kind:'read', title:'The 3-block day', body:'Morning main subjects, midday move-your-body, afternoon project time.' }),
      step({ kind:'do', title:'Draft yours', body:'Write the three blocks for tomorrow on a sticky note. Tape to the fridge.' }),
    ],
  },
  {
    id: 'c9', community: 'sports', title: 'Playbook + Devotionals', lessons: 8, progress: 0.50, color: 'grass', thumb: '⚽',
    description: 'Warm-up, drill, 90-second devotional, scrimmage.',
    steps: [
      step({ kind:'read', title:'Run strong, love stronger', body:'1 Cor 9:24 — run your race. But 1 Cor 13 — love first.' }),
      step({ kind:'do', title:'Kindness drill', body:'Every pass, say something kind to the receiver. Try it.' }),
    ],
  },
  {
    id: 'c10', community: 'pets', title: 'Care & Parables', lessons: 5, progress: 0.20, color: 'gold', thumb: '🐾',
    description: 'How to care for your pet + Bible parables using animals.',
    steps: [
      step({ kind:'read', title:'The lost sheep', body:'One wanders off. Shepherd leaves 99 for the 1. That is how God comes after you.' }),
      step({ kind:'do', title:'Pet check', body:'Water bowl full? Bed clean? Kind words said? Check ✅.' }),
    ],
  },
  {
    id: 'c11', community: 'bake', title: 'Thankful Baking', lessons: 6, progress: 0.0, color: 'rose', thumb: '🧁',
    description: 'Recipes + thank-you notes to bake for people in your life.',
    steps: [
      step({ kind:'read', title:'Who first?', body:'Pick ONE person to bless. Neighbor, grandparent, mail carrier, teacher.' }),
      step({ kind:'do', title:'Bake + note', body:'Make your chosen recipe. Write a tiny note with a verse.' }),
    ],
  },
  {
    id: 'c12', community: 'outdoor', title: 'Nature Devotionals', lessons: 6, progress: 0.17, color: 'grass', thumb: '🌲',
    description: 'Short devos to read on the trail.',
    steps: [
      step({ kind:'read', title:'Lilies of the field', body:'Matthew 6 — if God feeds the sparrows, He sees you too.' }),
      step({ kind:'reflect', title:'Today on the trail', body:'What one thing did you see that made you say wow?' }),
    ],
  },
];

const badges: BadgeDef[] = [
  { id: 'b1', name: 'Kind Words',     icon: '💛', rarity: 'common',    earned: true,  desc: 'Sent 10 kind messages.' },
  { id: 'b2', name: 'Scripture Star', icon: '⭐', rarity: 'common',    earned: true,  desc: 'Memorized 5 verses.' },
  { id: 'b3', name: 'Prayer Warrior', icon: '🙏', rarity: 'uncommon',  earned: true,  desc: 'Prayed for 7 friends.' },
  { id: 'b4', name: 'Helper',         icon: '🤝', rarity: 'uncommon',  earned: true,  desc: 'Helped a new kid.' },
  { id: 'b5', name: 'Creator',        icon: '🎨', rarity: 'uncommon',  earned: false, desc: 'Shared 20 drawings.' },
  { id: 'b6', name: 'Bookworm',       icon: '📚', rarity: 'rare',      earned: false, desc: 'Read 30 books.' },
  { id: 'b7', name: 'Worship Leader', icon: '🎤', rarity: 'rare',      earned: false, desc: 'Led a worship night.' },
  { id: 'b8', name: 'Angel Wings',    icon: '😇', rarity: 'legendary', earned: false, desc: 'Zero strikes for a full year.' },
];

const leaderboard: LeaderboardEntry[] = users.slice(0, 10).map((u, i) => ({
  ...u,
  rank: i + 1,
  weekXp: 980 - i * 87 + (i * 13) % 30,
}));

const prayerRequests: PrayerRequest[] = [
  { id: 'pr1', user: users[2],  time: '2h', text: "Please pray my dad finds a new job. He's been looking for 3 months.", prayers: 34 },
  { id: 'pr2', user: users[5],  time: '5h', text: "My grandma's surgery tomorrow 🙏", prayers: 128 },
  { id: 'pr3', user: users[8],  time: '1d', text: "I'm moving to a new school. Pray I make friends?", prayers: 57 },
  { id: 'pr4', user: users[11], time: '1d', text: "Thankful my brother's fever is gone! Praise God!", prayers: 82, answered: true },
  { id: 'pr5', user: users[14], time: '2d', text: "My best friend's parents are fighting. She's sad. Prayers please.", prayers: 43 },
  { id: 'pr6', user: users[17], time: '2d', text: "I have a big math test Friday. I studied but still nervous.", prayers: 29 },
  { id: 'pr7', user: users[20], time: '3d', text: "Our old dog is sick. I love him so much. 🐕", prayers: 76 },
  { id: 'pr8', user: users[1],  time: '4d', text: "Thankful my mom got the doctor news back — CLEAR! 🎉", prayers: 140, answered: true },
  { id: 'pr9', user: users[6],  time: '5d', text: "Praying for the kids in Syria. I saw the news with my mom.", prayers: 201 },
];

// -------- Chat seeds per room --------
const cm = (id: number, name: string, avatar: string, color: ColorKey, text: string, time: string, isAngel = false): ChatMessageSeed =>
  ({ id, name, avatar, color, text, time, isAngel });

const chatRoomSeeds: Record<string, ChatMessageSeed[]> = {
  General: [
    cm(1, 'Lily', '🦄', 'rose', 'Hi friends!! 🌟 Who made it to Sunday school?', '9:01'),
    cm(2, 'Caleb', '🦊', 'sky', 'Meee! We learned about Daniel today', '9:02'),
    cm(3, 'Gabriel', '😇', 'gold', 'Psst — today\'s verse is Daniel 6:22 "My God sent his angel…" 🦁', '9:02', true),
    cm(4, 'Maya', '🐰', 'coral', 'I drew a lion in the doodle room! wanna see?', '9:04'),
    cm(5, 'Ezra', '🐼', 'grass', 'YES show us 👀', '9:05'),
    cm(6, 'Gabriel', '😇', 'gold', 'Quiet hour starts in 20 minutes, friends 🌙', '9:06', true),
  ],
  'Prayer Circle': [
    cm(1, 'Miriam', '🐻', 'coral', "Can we pray for my grandma tomorrow morning?", '7:02'),
    cm(2, 'Gabriel', '😇', 'gold', "Yes. I've lit a candle. Anyone want to pray with Miriam?", '7:02', true),
    cm(3, 'Ada', '🦋', 'rose', "Praying right now 🕯️", '7:03'),
    cm(4, 'Asher', '🐢', 'sky', "Lord, hold Miriam's grandma close today. Amen.", '7:04'),
    cm(5, 'Gabriel', '😇', 'gold', "Beautiful. I'll ping when there's an update. 💛", '7:05', true),
  ],
  'Art Jam': [
    cm(1, 'Caleb', '🦊', 'sky', "OKAY check out my dragon 🐉", '3:12'),
    cm(2, 'Hannah', '🐥', 'gold', "That is ELITE.", '3:13'),
    cm(3, 'Maya', '🐰', 'coral', "Doing a watercolor ark tonight. Live on the doodle wall at 7.", '3:14'),
    cm(4, 'Gabriel', '😇', 'gold', "Reminder: save your favorite to your portfolio 📒", '3:15', true),
  ],
  'Book Club': [
    cm(1, 'Hannah', '🐥', 'gold', "Narnia chapter 3 was CRAZY. The Turkish delight scene!", '5:22'),
    cm(2, 'Silas', '🐙', 'grape', "I had to pause. Edmund why.", '5:23'),
    cm(3, 'Ivy', '🦉', 'sky', "My mom said the Turkish delight is a picture of sin — just takes and takes.", '5:24'),
    cm(4, 'Gabriel', '😇', 'gold', "Good catch, Ivy. Try the reflection prompts tonight 📖", '5:25', true),
  ],
  'Sports Chat': [
    cm(1, 'Noah', '🐻', 'sky', "Ran a mile without stopping!!", '6:41'),
    cm(2, 'Jonah', '🦊', 'coral', "LEGEND. Time?", '6:42'),
    cm(3, 'Noah', '🐻', 'sky', "12:18. Slow but real.", '6:42'),
    cm(4, 'Levi', '🐵', 'grass', "1 Cor 9:24 energy 💪", '6:43'),
  ],
  'Pet Photos': [
    cm(1, 'Tessa', '🐢', 'grass', "Biscuit took a nap in my laundry basket 🥹", '10:03'),
    cm(2, 'Isaac', '🐙', 'grape', "Goliath the goldfish is STILL small send help", '10:05'),
    cm(3, 'Gabriel', '😇', 'gold', "Reminder to keep pet names kind + share only with parent consent 📸", '10:06', true),
  ],
  'Worship Jam': [
    cm(1, 'Mara', '🐝', 'coral', "Who wants to jam Friday? I have chords for '10,000 Reasons'.", '4:01'),
    cm(2, 'Eli', '🐳', 'sky', "MEEE. I can do djembe.", '4:02'),
    cm(3, 'Grace', '🦕', 'grape', "I'll sing 🎤", '4:02'),
    cm(4, 'Gabriel', '😇', 'gold', "I'll line up the shared songbook link 🎵", '4:03', true),
  ],
};

const chatRoomsOrder: Array<{ key: keyof typeof chatRoomSeeds; icon: string; online: number }> = [
  { key: 'General',       icon: '💬', online: 12 },
  { key: 'Prayer Circle', icon: '🙏', online:  4 },
  { key: 'Art Jam',       icon: '🎨', online:  7 },
  { key: 'Book Club',     icon: '📚', online:  3 },
  { key: 'Sports Chat',   icon: '⚽', online:  5 },
  { key: 'Pet Photos',    icon: '🐾', online:  8 },
  { key: 'Worship Jam',   icon: '🎤', online:  2 },
];

const notifications: NotificationItem[] = [
  { id: 'n1', icon: '⭐', title: 'Scripture Star earned!', body: "You memorized 5 verses. Keep going — Bookworm is next.", time: '2m', color: 'gold' },
  { id: 'n2', icon: '🙏', title: 'Miriam asked for prayer', body: "Tap to pray with her for her grandma.", time: '1h', color: 'coral' },
  { id: 'n3', icon: '🎨', title: 'Ezra mentioned you', body: "in Garden of Eden doodle — come finish it with him!", time: '3h', color: 'grass' },
  { id: 'n4', icon: '📖', title: 'Bible 101 lesson 8 unlocked', body: "You finished lesson 7 last night. Let's keep going!", time: '1d', color: 'grape' },
  { id: 'n5', icon: '😇', title: 'Gabriel wrote your weekly report', body: "Zero strikes, 4 prayers sent, 12 kind words. Parents will love it.", time: '2d', color: 'sky' },
];

const parentActivityLog: ParentActivity[] = [
  { icon:'🎨', label:'Drew a rainbow in Art Angels',                    time:'9:14 AM',   kind:'positive' },
  { icon:'🙏', label:"Prayed for Miriam's grandma",                     time:'9:02 AM',   kind:'positive' },
  { icon:'📖', label:'Completed Lesson 7 of Bible 101',                 time:'Yesterday', kind:'positive' },
  { icon:'💬', label:'Said "good morning" in General',                  time:'Yesterday', kind:'neutral'  },
  { icon:'⭐', label:'Earned Scripture Star badge',                     time:'2 days ago',kind:'positive' },
  { icon:'😇', label:'Talked to Gabriel about a friend problem',        time:'3 days ago',kind:'neutral'  },
  { icon:'🎤', label:'RSVP\'d to Worship Night',                        time:'3 days ago',kind:'positive' },
  { icon:'🔕', label:'Entered quiet hour on time',                      time:'4 days ago',kind:'positive' },
];

export const HAVEN_DATA = {
  communities,
  users,
  feed,
  verse,
  events,
  classroom,
  badges,
  leaderboard,
  prayerRequests,
  chatRoomSeeds,
  chatRoomsOrder,
  notifications,
  parentActivityLog,
};

export type HavenData = typeof HAVEN_DATA;
