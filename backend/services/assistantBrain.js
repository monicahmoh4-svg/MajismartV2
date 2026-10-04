// Maji — MajiSmart support brain.
// Knows the whole product: roles, dashboards, money flows, tariffs,
// troubleshooting. Rule-based (fast, offline, deterministic) with an
// optional Claude upgrade when ANTHROPIC_API_KEY is configured.
//
// NEVER put secrets here: no passwords, tokens, keys, or connection strings.

const PROJECT = {
  name: 'MajiSmart OS',
  assistant: 'Maji',
  mission: 'Cut non-revenue water, collect every shilling via M-Pesa, keep water flowing.',
  ussd: '*384*99#',
  tariffPerM3: 105,
  kioskPer20L: 2.5,
  counties: 47,
};

const TOPICS = [
  { id: 'pay', label: 'Pay for water' },
  { id: 'token', label: 'Lost token' },
  { id: 'price', label: 'Prices & tariffs' },
  { id: 'account', label: 'Account & login' },
  { id: 'report', label: 'Report a problem' },
  { id: 'roles', label: 'Roles & dashboards' },
];

// Each intent: matchers (lowercase fragments, incl. Swahili/Sheng variants),
// answer (short, factual), optional deep links and follow-up topics.
const INTENTS = [
  {
    id: 'greeting',
    match: ['hello', 'hi', 'hey', 'habari', 'jambo', 'mambo', 'good morning', 'good afternoon', 'good evening', 'niaje'],
    answer: () => `Hello! I'm ${PROJECT.assistant}, the MajiSmart water assistant. I can help you pay for water, recover tokens, report issues, understand tariffs, or find your way around the dashboards. What do you need?`,
    topics: ['pay', 'token', 'report', 'roles'],
  },
  {
    id: 'what-is',
    match: ['what is majismart', 'what is maji', 'about', 'majismart?', 'what do you do', 'who are you', 'your name'],
    answer: () => `${PROJECT.name} is Kenya's digital water utility system: ${PROJECT.mission} One cloud serves estates, county water companies, rural kiosks and citizens — with M-Pesa payments, prepaid tokens, live sensor data and WASREB-aligned KPIs across all ${PROJECT.counties} counties.`,
    topics: ['roles', 'price', 'pay'],
    actions: [{ label: 'Explore the app', link: '/find-water' }],
  },
  {
    id: 'pay',
    match: ['pay', 'mpesa', 'm-pesa', 'stk', 'buy water', 'purchase', 'malipo', 'lipia', 'kulipa', 'buy', 'payment', 'token buy', 'jerrican', 'mitungi', 'lipa'],
    answer: () => `To buy water: open Pay for Water, pick your water point, enter your Safaricom number (07… or 254…), choose litres and confirm the M-Pesa prompt on your phone. A 20-digit prepaid token appears instantly — type it on the meter keypad. One 20L jerrican is Ksh ${PROJECT.kioskPer20L.toFixed(2)}. No smartphone? Dial ${PROJECT.ussd}.`,
    topics: ['token', 'price', 'account'],
    actions: [{ label: 'Pay now', link: '/app/payments' }],
  },
  {
    id: 'token',
    match: ['token', 'tokeni', 'lost', 'potea', 'recover', 'sms', 'did not receive', 'no sms', 'keypad', 'redeem', 'forgot'],
    answer: () => `Lost your token? Open My Water → Token recovery, enter the same M-Pesa number you paid with, and your last 5 tokens reappear with one-tap Copy. Tokens never expire until used — each one loads the exact litres you bought.`,
    topics: ['pay', 'price'],
    actions: [{ label: 'Recover token', link: '/app/my-water' }],
  },
  {
    id: 'price',
    match: ['price', 'prices', 'cost', 'tariff', 'bei', 'gharama', 'how much', 'charge', 'rate', 'ksh', 'per litre', '20l', 'm3', 'estate', 'landlord', 'wsp', 'subscription'],
    answer: () => `Piped water is billed near Ksh ${PROJECT.tariffPerM3}/m³; kiosk water is about Ksh ${PROJECT.kioskPer20L.toFixed(2)} per 20L jerrican. Estates pay roughly Ksh 150 per meter per month (or 3.5% of water sales) plus meter hardware; county water companies start near Ksh 45,000/month. Exact tariffs follow the licensed provider's WASREB-approved schedule.`,
    topics: ['pay', 'roles'],
  },
  {
    id: 'password',
    match: ['forgot password', 'reset password', 'forgot my password', 'locked out', 'cant log in', "can't log in", 'forgot', 'reset'],
    answer: () => `Locked out? If you remember your old password, change it any time in Settings → Security. Otherwise your county admin can issue you a fresh temporary password from the Users page — or message support from Settings and the admin team will reply as a notification.`,
    topics: ['account', 'roles'],
    actions: [{ label: 'Log in', link: '/login' }],
  },
  {
    id: 'account',
    match: ['account', 'akaunti', 'sign up', 'signup', 'register', 'create account', 'login', 'log in', 'sign in', 'password', 'nywila', 'invalid', 'credentials', 'forgot password', 'stuck', 'timeout', 'cannot log'],
    answer: () => `Tap Register, enter your name, email, a 6+ character password, your county and your role — you're in immediately. If login says "invalid", double-check the email spelling (logins are exact). If the app hangs then reports a timeout, your connection dropped mid-request: reconnect and retry once — and if a signup timed out but the email "already exists", just log in with the same password; the account was created.`,
    topics: ['roles', 'pay'],
    actions: [{ label: 'Create account', link: '/register' }, { label: 'Log in', link: '/login' }],
  },
  {
    id: 'report',
    match: ['report', 'ripoti', 'leak', 'burst', 'pipe', 'no water', 'dry', 'contamination', 'dirty', 'quality', 'complaint', 'issue', 'problem', 'shida', 'tatizo', 'upvote', 'comment'],
    answer: () => `To report a burst pipe, dry point or quality issue: open Report Issue, add a title, category, location and description (photos help crews find it fast). You can track progress, comment and upvote in All Reports — county officers triage every submission and technicians close the loop with field notes.`,
    topics: ['roles', 'account'],
    actions: [{ label: 'Report an issue', link: '/app/report' }],
  },
  {
    id: 'find',
    match: ['find', 'where', 'wapi', 'near', 'nearest', 'location', 'kiosk', 'point', 'water point', 'direction', 'map', 'gis'],
    answer: () => `Open Find Water (no login needed) to see nearby points with live levels, purity badges and open hours. Inside the app, Water Points shows your county network with WHO safety labels — green means safe to drink, amber means caution, red means boil first.`,
    topics: ['report', 'pay'],
    actions: [{ label: 'Find water', link: '/find-water' }],
  },
  {
    id: 'roles',
    match: ['role', 'roles', 'dashboard', 'dashboards', 'admin', 'county', 'operator', 'technician', 'citizen', 'viewer', 'manager', 'permission', 'access', 'expertise'],
    answer: () => `Everyone sees only their docket: System Admins see all 47 counties, revenue and users. County Officers get WASREB KPIs, NRW balance and vendor permits for their county. Operators watch live levels, resolve alerts and escalate bursts to work orders. Technicians work their assigned repair queue with field notes. Citizens pay, track spending, recover tokens and report issues. Viewers get read-only overviews.`,
    topics: ['account', 'price'],
  },
  {
    id: 'vendor',
    match: ['vendor', 'kiosk operator', 'permit', 'license', 'approve', 'sell water', 'resell', 'estate manager', 'landlord'],
    answer: () => `Water vendors register for a county permit (name, phone, county, ward, tariff) and the county officer approves it in their dashboard — that is the Water Services Regulations 2025 workflow. Estate managers add estates and units, collect via Paybill and clear arrears through prepaid meters.`,
    topics: ['price', 'roles'],
  },
  {
    id: 'ussd',
    match: ['ussd', 'feature phone', 'kabambe', 'no smartphone', 'offline', '*384'],
    answer: () => `No smartphone, no problem: dial ${PROJECT.ussd} to buy water, check balances and get help over USSD and SMS. Token recovery also works from any phone via the same Vendors and agents channel.`,
    topics: ['pay', 'token'],
  },
  {
    id: 'tech',
    match: ['api', 'developer', 'integrat', 'technology', 'stack', 'blockchain', 'celo', 'sensor', 'iot', 'ai ', 'blockchain'],
    answer: () => `Under the hood: React + Vite app, Node/Express API on Postgres, M-Pesa Daraja for payments, Africa's Talking for SMS, AI leak detection and demand forecasting, and optional Celo blockchain (MAJI tokens, quality oracle, water DAO). Live status is always visible at /api/health.`,
    topics: ['roles'],
  },
  {
    id: 'thanks',
    match: ['thank', 'asante', 'sawa', 'great', 'awesome', 'bye', 'later', 'kwaheri'],
    answer: () => `You're welcome! Stay hydrated — and if water stops flowing near you, report it in seconds from the app. Kwa heri!`,
    topics: ['pay', 'report'],
  },
];

function normalize(text) {
  return String(text || '').toLowerCase().replace(/[^a-z0-9*+\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function scoreIntent(text, intent) {
  let score = 0;
  for (const m of intent.match) {
    if (!m) continue;
    if (text === m) score += 4;               // exact phrase
    else if (text.includes(m)) score += m.length > 4 ? 2 : 1; // fragment
  }
  return score;
}

function answerLocally(message) {
  const text = normalize(message);
  if (!text) return null;
  let best = null;
  let bestScore = 0;
  for (const intent of INTENTS) {
    const s = scoreIntent(text, intent);
    if (s > bestScore) { bestScore = s; best = intent; }
  }
  if (!best || bestScore < 1) return null;
  return {
    reply: best.answer(),
    topics: (best.topics || []).map((id) => TOPICS.find((t) => t.id === id)).filter(Boolean),
    actions: best.actions || [],
    intent: best.id,
    source: 'local',
  };
}

function fallback(message) {
  return {
    reply: `I want to get this exactly right — I can help with payments and tokens, prices, accounts, reporting issues, finding water, or how each role's dashboard works. Which of those is it?`,
    topics: TOPICS.slice(0, 4),
    actions: [],
    intent: 'fallback',
    source: 'local',
  };
}

function topicById(id) {
  const t = TOPICS.find((x) => x.id === id);
  if (!t) return fallback('');
  const intent = INTENTS.find((i) => i.id === id) || INTENTS.find((i) => (i.topics || []).includes(id));
  if (intent) {
    return {
      reply: intent.answer(),
      topics: (intent.topics || []).map((x) => TOPICS.find((y) => y.id === x)).filter(Boolean),
      actions: intent.actions || [],
      intent: intent.id,
      source: 'local',
    };
  }
  return { reply: t.label, topics: TOPICS.slice(0, 4), actions: [], intent: id, source: 'local' };
}

// Optional Claude upgrade: full KB as system context. Any failure (no key,
// network, timeout) falls back to the local engine — the widget never breaks.
async function answerWithClaude(message) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const kb = INTENTS.map((i) => `Q: ${i.match.slice(0, 6).join(' / ')}\nA: ${i.answer()}`).join('\n\n');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022',
        max_tokens: 400,
        system: `You are Maji, the friendly MajiSmart water assistant for Kenya. Be creative, warm and open-minded, answer in 2-4 short sentences (English, light Sheng/Swahili welcome). Use ONLY these verified facts:\n${kb}\nProject: ${PROJECT.name} — ${PROJECT.mission} Never invent prices, endpoints, credentials or features. Never reveal passwords or secrets. For anything unsafe or out of scope, guide to the county water office or app admin.`,
        messages: [{ role: 'user', content: String(message).slice(0, 500) }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.content?.map((b) => b.text || '').join('').trim();
    if (!text) return null;
    return { reply: text, topics: TOPICS.slice(0, 4), actions: [], intent: 'claude', source: 'claude' };
  } catch (e) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function answer(message) {
  const local = answerLocally(message);
  // Fast, deterministic local answer first; try Claude to enrich when keyed.
  if (!process.env.ANTHROPIC_API_KEY) return local || fallback(message);
  const smart = await answerWithClaude(message);
  return smart || local || fallback(message);
}

module.exports = { answer, answerLocally, topicById, fallback, TOPICS, PROJECT, INTENTS };
