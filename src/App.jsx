import { useState, useEffect, useCallback, useMemo, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   DOKI — INFLUENCER COMMAND CENTER
   Modules: Discovery · CRM Pipeline · Spend Tracker
   Auth: Password-protected team access
   API: Instagram Graph API via @dokimeats
   Style: Instagram Dark Mode · Currency: INR (₹)
   ═══════════════════════════════════════════════════════════════════════════ */

// ─── CONFIG — Update these values ───────────────────────────────────────────
const CONFIG = {
  // Team password — change this to something your team knows
  TEAM_PASSWORD: "doki2026",

  // Instagram Graph API — @dokimeats
  // To get a long-lived token:
  // 1. Go to developers.facebook.com → your app → Graph API Explorer
  // 2. Select your app, select "Get User Token"
  // 3. Check: instagram_basic, pages_show_list, pages_read_engagement
  // 4. Generate token → then exchange for long-lived token (60 days)
  IG_ACCESS_TOKEN: "IGAANWb9Bx8JdBZAGFCT1VLMlVlRFhfdVEwMUlYeHlpdXlab1lrSmY1WkFsc3A5T05YUGptbXo0b2o1MlRsdmpkRWhqSVpfUFBEU19VMngwSlIyQk9kMFJHd2pKRFd3bjl6blZApd1JjdmR0eE1qT29pXzRoVU1yU05NTGN5M2dPZAwZDZD",  // @dokimeats live token
  IG_BUSINESS_ID: "17841429694489589", // @dokimeats IG Business ID
};

// ─── Constants ──────────────────────────────────────────────────────────────
const NICHES = ["Food & Snacks","Fitness & Health","Fashion","Beauty","Travel","Tech","Lifestyle","Parenting","Comedy","Education","D2C Brands","Gaming","Photography","Wellness","Finance","Nutritionist","Leadership","Music","Reading","Information","Mom Content"];

// ─── Niche → Problem Solved for DOKi ────────────────────────────────────────
// problem: why this niche matters for DOKi
// product: "Chips" / "Jerky" / "Both" — best product fit for this niche's audience
const NICHE_PROBLEM = {
  "Food & Snacks":    { problem: "Taste credibility; positions DOKi in snack reviews & hauls — drives trial", product: "Both" },
  "Fitness & Health": { problem: "High-protein post-workout snack; replaces junk with clean protein", product: "Jerky" },
  "Fashion":          { problem: "Lifestyle integration; DOKi as the trendy snack for style-conscious consumers", product: "Chips" },
  "Beauty":           { problem: "Guilt-free snacking; fits wellness/self-care routines", product: "Chips" },
  "Travel":           { problem: "On-the-go protein; travel-friendly snack that fits in any bag", product: "Both" },
  "Tech":             { problem: "Young male demo; DOKi as the desk/gaming snack", product: "Chips" },
  "Lifestyle":        { problem: "Broad integration; normalizes DOKi as an everyday go-to snack", product: "Both" },
  "Parenting":        { problem: "Healthy kids snack; trusted by parents for protein content", product: "Chips" },
  "Comedy":           { problem: "Viral reach & brand recall; makes DOKi fun, shareable, memorable", product: "Both" },
  "Education":        { problem: "Smart snacking narrative; DOKi's nutrition facts explained", product: "Both" },
  "D2C Brands":       { problem: "Cross-brand audience; reaches people already buying D2C online", product: "Both" },
  "Gaming":           { problem: "Late-night protein fuel; replaces chips with high-protein alternative", product: "Chips" },
  "Photography":      { problem: "Premium visual content; aesthetic product shots for ads", product: "Both" },
  "Wellness":         { problem: "Clean eating angle; whole-food protein snack alternative to processed junk", product: "Jerky" },
  "Finance":          { problem: "Disciplined audience; DOKi as smart investment in health", product: "Jerky" },
  "Nutritionist":     { problem: "Expert credibility; professional endorsement of protein & nutrition profile", product: "Jerky" },
  "Leadership":       { problem: "High-performer positioning; DOKi as fuel for ambitious people", product: "Jerky" },
  "Music":            { problem: "Cultural relevance; DOKi associated with youth/vibe culture", product: "Chips" },
  "Reading":          { problem: "Niche educated audience; mindful snacking companion", product: "Chips" },
  "Information":      { problem: "Educational reach; DOKi's USP & nutrition explained to curious audience", product: "Both" },
  "Mom Content":      { problem: "Family purchase decisions; moms recommend DOKi as healthy family snack", product: "Chips" },
};
const LOCATIONS = ["Mumbai","Delhi","Bangalore","Hyderabad","Chennai","Pune","Kolkata","Jaipur","Ahmedabad","Lucknow","Chandigarh","Indore","Surat","Kochi","Gurgaon","Noida","Bhopal","Nagpur","Patna","Coimbatore"];
const STAGES = ["Prospect","In Talks","Active","Done"];
const TEAM_MEMBERS = ["Dyaus", "Manik", "BK"];
const STAGE_CLR = {"Prospect":"#8B5CF6","In Talks":"#F59E0B","Active":"#10B981","Done":"#6B7280"};
const CONTENT_TYPES = ["Reel","Story","Post","Carousel","Video","Collab"];

// ─── Budget Config ───────────────────────────────────────────────────────────
const MONTHLY_BUDGET = 150000; // ₹1.5L
const BUDGET_TIERS = [
  { label: "Nano", range: "3K–10K followers", color: "#10B981", pct: 45, note: "12–15 creators · ₹2K–4K each" },
  { label: "Micro", range: "10K–20K followers", color: "#0095F6", pct: 30, note: "4–5 creators · ₹5K–8K each" },
  { label: "Mid",   range: "20K–40K followers", color: "#8B5CF6", pct: 15, note: "1–2 creators · ₹10K–15K each" },
  { label: "Buffer",range: "Negotiation room",  color: "#F59E0B", pct: 10, note: "Reshoot, boosts, extras" },
];

// ─── Deliverable Status ──────────────────────────────────────────────────────
const DELIV_STATUS = ["Pending","Brief Sent","Content Received","Live","Ad Rights Active"];
const DELIV_CLR = { "Pending":"#737373","Brief Sent":"#F59E0B","Content Received":"#0095F6","Live":"#10B981","Ad Rights Active":"#8B5CF6" };

const fmt = n => { if(n>=1e6) return (n/1e6).toFixed(1)+"M"; if(n>=1e3) return (n/1e3).toFixed(n>=1e4?0:1)+"K"; return ""+n; };
const inr = n => "₹"+(n||0).toLocaleString("en-IN");

// ─── Engagement Benchmarks by Follower Tier ─────────────────────────────────
// Based on 2024 industry data: (Likes + Comments) / Followers × 100
const ENG_BENCHMARKS = [
  { min:1000,    max:5000,    avg:[3,5],    good:[5,7],    great:7    },
  { min:5000,    max:10000,   avg:[2,3.5],  good:[3.5,5],  great:5    },
  { min:10000,   max:50000,   avg:[1.5,2.5],good:[2.5,4],  great:4    },
  { min:50000,   max:100000,  avg:[1,2],    good:[2,3],    great:3    },
  { min:100000,  max:500000,  avg:[0.8,1.5],good:[1.5,2.5],great:2.5  },
  { min:500000,  max:1000000, avg:[0.5,1],  good:[1,1.8],  great:1.8  },
  { min:1000000, max:Infinity,avg:[0.5,0.8],good:[0.8,1.5],great:1.5  },
];

function getEngRating(followers, engRate) {
  const tier = ENG_BENCHMARKS.find(t => followers >= t.min && followers < t.max) || ENG_BENCHMARKS[ENG_BENCHMARKS.length-1];
  if (engRate >= tier.great) return { label: "Great", color: "#8B5CF6", emoji: "🔥" };
  if (engRate >= tier.good[0]) return { label: "Good", color: "#10B981", emoji: "👍" };
  if (engRate >= tier.avg[0]) return { label: "Avg", color: "#F59E0B", emoji: "➖" };
  return { label: "Low", color: "#EF4444", emoji: "⚠️" };
}

function getEngBenchmark(followers) {
  return ENG_BENCHMARKS.find(t => followers >= t.min && followers < t.max) || ENG_BENCHMARKS[ENG_BENCHMARKS.length-1];
}

// ─── Smart Recommendation Engine ────────────────────────────────────────────
function getRecommendations(pipeline, payments, allCandidates) {
  const pipeEntries = Object.values(pipeline);
  if (pipeEntries.length === 0) return { recommended: [], reason: "empty" };

  // Analyze pipeline patterns
  const nicheFreq = {};
  const locationFreq = {};
  let totalEng = 0, totalFollowers = 0, count = 0;
  const highROIInfluencers = [];

  pipeEntries.forEach(inf => {
    if (inf.niche && inf.niche !== "—") nicheFreq[inf.niche] = (nicheFreq[inf.niche]||0) + 1;
    if (inf.location && inf.location !== "—") locationFreq[inf.location] = (locationFreq[inf.location]||0) + 1;
    totalEng += inf.eng || 0;
    totalFollowers += inf.followers || 0;
    count++;
  });

  // Factor in spend efficiency — find high-ROI influencers
  const payByInf = {};
  payments.forEach(p => {
    if (!payByInf[p.infId]) payByInf[p.infId] = { spend: 0, revenue: 0, engagements: 0 };
    payByInf[p.infId].spend += p.amount || 0;
    payByInf[p.infId].revenue += p.revenue || 0;
    payByInf[p.infId].engagements += p.engagements || 0;
  });

  Object.entries(payByInf).forEach(([id, data]) => {
    if (data.spend > 0 && data.revenue > data.spend) {
      const inf = pipeline[id];
      if (inf) highROIInfluencers.push(inf);
    }
  });

  const topNiches = Object.entries(nicheFreq).sort((a,b) => b[1]-a[1]).map(e => e[0]);
  const topLocations = Object.entries(locationFreq).sort((a,b) => b[1]-a[1]).map(e => e[0]);
  const avgEng = count > 0 ? totalEng / count : 3;
  const avgFollowers = count > 0 ? totalFollowers / count : 50000;
  const followerRange = [avgFollowers * 0.3, avgFollowers * 3];

  // Score candidates
  const pipeIds = new Set(pipeEntries.map(e => e.id));
  const scored = allCandidates
    .filter(c => !pipeIds.has(c.id))
    .map(c => {
      let score = 0;
      // Niche match (weighted by frequency)
      if (topNiches.includes(c.niche)) score += 30 * (1 - topNiches.indexOf(c.niche) * 0.15);
      // Location match
      if (topLocations.includes(c.location)) score += 15 * (1 - topLocations.indexOf(c.location) * 0.2);
      // Engagement quality (prefer Good/Great rated)
      const rating = getEngRating(c.followers, c.eng);
      if (rating.label === "Great") score += 25;
      else if (rating.label === "Good") score += 15;
      else if (rating.label === "Avg") score += 5;
      // Follower range similarity
      if (c.followers >= followerRange[0] && c.followers <= followerRange[1]) score += 10;
      // Similar to high-ROI influencers (bonus)
      highROIInfluencers.forEach(hri => {
        if (c.niche === hri.niche) score += 10;
        if (c.location === hri.location) score += 5;
        if (Math.abs(c.followers - hri.followers) < hri.followers * 0.5) score += 5;
      });
      // Growth bonus
      if (c.growth > 5) score += 8;
      else if (c.growth > 2) score += 4;

      return { ...c, recScore: Math.min(99, Math.round(score)), similarity: Math.min(99, Math.round(score)) };
    })
    .sort((a, b) => b.recScore - a.recScore);

  return {
    recommended: scored.slice(0, 20),
    topNiches: topNiches.slice(0, 3),
    topLocations: topLocations.slice(0, 3),
    avgEng: avgEng.toFixed(1),
    highROICount: highROIInfluencers.length,
    reason: "ok"
  };
}

// ─── Brand Collab Search via IG API ─────────────────────────────────────────
async function fetchBrandCollabs(brandUsername) {
  if (!CONFIG.IG_ACCESS_TOKEN) return { collabs: [], error: "no_token" };
  try {
    // Fetch brand's recent media with tagged users via business_discovery
    const url = `https://graph.facebook.com/v19.0/${CONFIG.IG_BUSINESS_ID}?fields=business_discovery.username(${brandUsername}){username,name,followers_count,profile_picture_url,media.limit(50){caption,timestamp,media_type,like_count,comments_count,children{id}}}&access_token=${CONFIG.IG_ACCESS_TOKEN}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) return { collabs: [], error: data.error.message, brandInfo: null };
    if (!data.business_discovery) return { collabs: [], error: "not_found", brandInfo: null };

    const bd = data.business_discovery;
    const brandInfo = {
      username: bd.username, name: bd.name,
      followers: bd.followers_count,
      avatar: bd.profile_picture_url
    };

    // Extract mentions from captions (@handles)
    const mentionMap = {};
    const media = bd.media?.data || [];
    media.forEach(post => {
      const caption = post.caption || "";
      // Find @mentions in captions
      const mentions = caption.match(/@[\w.]+/g) || [];
      mentions.forEach(m => {
        const handle = m.toLowerCase();
        if (handle === `@${brandUsername.toLowerCase()}`) return; // skip self-mentions
        if (!mentionMap[handle]) {
          mentionMap[handle] = { handle, collabCount: 0, posts: [], totalLikes: 0, totalComments: 0 };
        }
        mentionMap[handle].collabCount++;
        mentionMap[handle].totalLikes += post.like_count || 0;
        mentionMap[handle].totalComments += post.comments_count || 0;
        mentionMap[handle].posts.push({
          timestamp: post.timestamp,
          likes: post.like_count || 0,
          comments: post.comments_count || 0,
          type: post.media_type
        });
      });
    });

    // Sort by collab count, then engagement
    const collabs = Object.values(mentionMap)
      .sort((a, b) => b.collabCount - a.collabCount || (b.totalLikes + b.totalComments) - (a.totalLikes + a.totalComments));

    return { collabs, brandInfo, totalPosts: media.length, error: null };
  } catch (e) {
    console.error("Brand collab search error:", e);
    return { collabs: [], error: e.message, brandInfo: null };
  }
}

// Generate demo brand collab data when API is not available
function genDemoBrandCollabs(brandName) {
  const s = brandName ? [...brandName].reduce((a,c)=>a+c.charCodeAt(0),0) : 55;
  const handles = [
    "fitfoodie_in","proteinchef","mumbai.eats","snackreviewer","healthnut_delhi",
    "gymbro.pune","ketolife.in","cleaneating_blr","macrocoach_in","fitnessfuel.hyd",
    "nutrifit_mom","desi.gains","mealprep.india","protein.pantry","snackattack.in",
    "highprotein.life","musclemunch_in","fitfam.delhi","eatclean.mum","gymrat.blr"
  ];
  return handles.slice(0, 8 + s % 6).map((h, i) => {
    const r = ((s+i*23)%100)/100;
    return {
      handle: "@" + h,
      collabCount: Math.max(1, Math.floor(5 - i * 0.4 + r * 2)),
      totalLikes: Math.floor(2000 + r * 30000),
      totalComments: Math.floor(100 + r * 2000),
      posts: Array.from({length: Math.max(1, Math.floor(3 - i*0.3))}, (_, j) => ({
        timestamp: new Date(Date.now() - (i*7+j*3)*86400000).toISOString(),
        likes: Math.floor(500 + r * 8000),
        comments: Math.floor(20 + r * 500),
        type: ["IMAGE","VIDEO","CAROUSEL_ALBUM"][j%3]
      }))
    };
  });
}

// ─── Storage ────────────────────────────────────────────────────────────────
const load = (k, fb) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fb; } catch { return fb; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// ─── Demo Data ──────────────────────────────────────────────────────────────
function genDemo(seed) {
  const s = seed ? [...seed].reduce((a,c)=>a+c.charCodeAt(0),0) : 42;
  const names = [
    "FitBite_Official","SnackQueenIN","ProteinPulseHQ","CrunchyVibes_","DelhiFoodWalks",
    "MumbaiMunchies","HealthyHustleHQ","NutriFuel_in","ChipTripIndia","KetoKingIN",
    "GymFuelDaily","TastyTrailsIN","SpiceSistersBLR","CleanEatsDelhi","SnackLabIN",
    "FoodieFixMUM","ProteinPackIN","BiteBoxDaily","CraveClubIN","MunchMapIndia",
    "FitFoodieHYD","NashNookPune","GrainGangIN","HealthHackIN","SnackSavvyIN",
    "BiteBlissBLR","CrunchCulture_","ZeroJunkIN","MacroMealsIN","TastyTwistDEL",
    "ProteinPopIN","SnackStackIN","FuelFitIN","NibbleNationIN","CleanCrunchIN",
    "DesiSnackBox","HighProteinIN","MunchModeIN","SnackScoutIN","FitBitesDaily",
    "ChickenChipsIN","JerkyJunctionIN","MeatSnackHQ","ProSnackDelhi","CrispyBites_IN"
  ];
  return names.map((name,i) => {
    const r=((s+i*31)%100)/100, r2=((s+i*17)%100)/100;
    const followers = Math.floor(3000 + r*300000 + r2*200000);
    const eng = +(1.5 + ((s+i*13)%65)/10).toFixed(2);
    const niche = NICHES[(s+i*3)%NICHES.length];
    const location = LOCATIONS[(s+i*5)%LOCATIONS.length];
    const avgLikes = Math.floor(followers * eng/100 * 0.85);
    const avgComments = Math.floor(avgLikes * 0.07);
    const similarity = Math.max(35, Math.floor(99 - i*1.3 - r*6));
    return {
      id: "inf_"+i, handle: "@"+name.toLowerCase(), name: name.replace(/_/g," "),
      followers, eng, niche, location, avgLikes, avgComments,
      posts: Math.floor(80+r*1200), following: Math.floor(150+r*2500),
      similarity, verified: followers>150000 && r>0.45,
      growth: +(-1+r*12).toFixed(1),
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=262626&textColor=ffffff&fontSize=36`
    };
  });
}

// ─── RapidAPI — Instagram Scraper Stable API ────────────────────────────────
const RAPID_KEY = "f5e93dd175mshd1e5505200ba950p12c49bjsn9f24ad982232";
const RAPID_HOST = "instagram-scraper-stable-api.p.rapidapi.com";
const RAPID_BASE = `https://${RAPID_HOST}`;

// Simple in-memory cache to avoid repeated API calls within same session
const _rapidCache = {};
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function rapidPost(endpoint, body) {
  const cacheKey = endpoint + JSON.stringify(body);
  if (_rapidCache[cacheKey]) return _rapidCache[cacheKey];
  const res = await fetch(`${RAPID_BASE}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "x-rapidapi-key": RAPID_KEY,
      "x-rapidapi-host": RAPID_HOST,
    },
    body: new URLSearchParams(body).toString(),
  });
  const data = await res.json();
  if (!data?.error) _rapidCache[cacheKey] = data;
  return data;
}

async function rapidGet(endpoint, params) {
  const qs = new URLSearchParams(params).toString();
  const cacheKey = endpoint + qs;
  if (_rapidCache[cacheKey]) return _rapidCache[cacheKey];
  const res = await fetch(`${RAPID_BASE}/${endpoint}?${qs}`, {
    headers: {
      "x-rapidapi-key": RAPID_KEY,
      "x-rapidapi-host": RAPID_HOST,
    },
  });
  const data = await res.json();
  if (!data?.error && !(Array.isArray(data) && data.length === 0)) _rapidCache[cacheKey] = data;
  return data;
}

/** Fetch profile via RapidAPI — ig_get_fb_profile_v3 */
async function fetchRapidProfile(username) {
  try {
    const data = await rapidPost("ig_get_fb_profile_v3.php", { username_or_url: username });
    const d = data;
    if (!d?.username) return null;
    const followers = d.follower_count || 0;
    // Compute eng from edge_owner_to_timeline_media if available
    const edges = d.edge_owner_to_timeline_media?.edges || [];
    const totalLikes = edges.reduce((s, e) => s + (e.node?.edge_liked_by?.count || 0), 0);
    const totalComments = edges.reduce((s, e) => s + (e.node?.edge_media_to_comment?.count || 0), 0);
    const engRate = edges.length > 0 && followers > 0
      ? +((totalLikes + totalComments) / edges.length / followers * 100).toFixed(2)
      : 0;
    return {
      id: "rapi_" + d.username,
      handle: "@" + d.username,
      name: d.full_name || d.username,
      followers,
      following: d.following_count || 0,
      posts: d.edge_owner_to_timeline_media?.count || 0,
      eng: engRate,
      avgLikes: edges.length > 0 ? Math.round(totalLikes / edges.length) : 0,
      avgComments: edges.length > 0 ? Math.round(totalComments / edges.length) : 0,
      avatar: d.profile_pic_url_hd || d.profile_pic_url || "",
      bio: d.biography || "",
      verified: d.is_verified || false,
      niche: "—", location: "—", similarity: 0, growth: 0,
      isReal: true,
    };
  } catch (e) {
    console.error("RapidAPI profile error:", e);
    return null;
  }
}

/** Fetch similar accounts via RapidAPI — get_ig_similar_accounts */
async function fetchRapidSimilar(username) {
  try {
    const data = await rapidGet("get_ig_similar_accounts.php", { username_or_url: username });
    // Response is a direct array of account objects
    const accounts = Array.isArray(data) ? data : (data?.data || data?.accounts || []);
    if (!accounts.length) return [];
    return accounts.map((a, i) => {
      const followers = a.edge_followed_by?.count || a.follower_count || 0;
      return {
        id: "rapi_sim_" + (a.id || i),
        handle: "@" + (a.username || ""),
        name: a.full_name || a.username || "",
        followers,
        following: a.edge_follow?.count || 0,
        posts: a.edge_owner_to_timeline_media?.count || 0,
        eng: 0,
        avgLikes: 0, avgComments: 0,
        avatar: a.profile_pic_url || `https://api.dicebear.com/7.x/initials/svg?seed=${a.username}&backgroundColor=262626&textColor=ffffff&fontSize=36`,
        bio: a.biography || "",
        verified: a.is_verified || false,
        niche: "—", location: "—",
        similarity: Math.max(60, 95 - i * 3),
        growth: 0,
        isReal: true,
      };
    });
  } catch (e) {
    console.error("RapidAPI similar accounts error:", e);
    return [];
  }
}

// ─── Instagram Graph API helpers ────────────────────────────────────────────
async function fetchIGProfile(username) {
  if (!CONFIG.IG_ACCESS_TOKEN) return null;
  try {
    // Search for business user by username
    const searchUrl = `https://graph.facebook.com/v19.0/${CONFIG.IG_BUSINESS_ID}?fields=business_discovery.fields(username,name,biography,follows_count,followers_count,media_count,profile_picture_url,media.limit(12){like_count,comments_count,timestamp,media_type,caption})&access_token=${CONFIG.IG_ACCESS_TOKEN}`.replace(
      CONFIG.IG_BUSINESS_ID,
      `${CONFIG.IG_BUSINESS_ID}?fields=business_discovery.fields(username,name,biography,follows_count,followers_count,media_count,profile_picture_url,media.limit(12){like_count,comments_count,timestamp,media_type,caption})`.replace(
        "business_discovery",
        `business_discovery.username(${username})`
      )
    );
    // Simplified — use the business_discovery endpoint
    const url = `https://graph.facebook.com/v19.0/${CONFIG.IG_BUSINESS_ID}?fields=business_discovery.username(${username}){username,name,biography,follows_count,followers_count,media_count,profile_picture_url,media.limit(12){like_count,comments_count,timestamp,media_type}}&access_token=${CONFIG.IG_ACCESS_TOKEN}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.business_discovery) {
      const bd = data.business_discovery;
      const media = bd.media?.data || [];
      const totalLikes = media.reduce((s, m) => s + (m.like_count || 0), 0);
      const totalComments = media.reduce((s, m) => s + (m.comments_count || 0), 0);
      const avgLikes = media.length > 0 ? Math.round(totalLikes / media.length) : 0;
      const avgComments = media.length > 0 ? Math.round(totalComments / media.length) : 0;
      const engRate = bd.followers_count > 0 ? +((totalLikes + totalComments) / media.length / bd.followers_count * 100).toFixed(2) : 0;
      return {
        id: "ig_" + bd.username,
        handle: "@" + bd.username,
        name: bd.name || bd.username,
        followers: bd.followers_count,
        following: bd.follows_count,
        posts: bd.media_count,
        eng: engRate,
        avgLikes,
        avgComments,
        avatar: bd.profile_picture_url || "",
        bio: bd.biography || "",
        verified: false,
        niche: "—",
        location: "—",
        similarity: 0,
        growth: 0,
        isReal: true
      };
    }
    return null;
  } catch (e) {
    console.error("IG API error:", e);
    return null;
  }
}

// ─── SVG Icons ──────────────────────────────────────────────────────────────
const I = {
  search: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  discover: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="m14.31 8 5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16 3.95 6.06M14.31 16H2.83M16.62 12l-5.74 9.94"/></svg>,
  pipeline: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  money: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  plus: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>,
  check: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>,
  x: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  heart: <svg width="14" height="14" fill="#FF3040" stroke="none" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  comment: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  arrow: <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>,
  up: <svg width="12" height="12" fill="none" stroke="#10B981" strokeWidth="2.5" viewBox="0 0 24 24"><path d="m18 15-6-6-6 6"/></svg>,
  down: <svg width="12" height="12" fill="none" stroke="#EF4444" strokeWidth="2.5" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>,
  verified: <svg width="14" height="14" viewBox="0 0 24 24" fill="#3897F0"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14 2 9.27l6.91-1.01z"/></svg>,
  filter: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>,
  trash: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  lock: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  star: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14 2 9.27l6.91-1.01z"/></svg>,
  brand: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  eye: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  eyeOff: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  live: <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="#10B981"/></svg>,
};

// ─── Color Palette ──────────────────────────────────────────────────────────
const C = {
  bg: "#000000", card: "#121212", cardHover: "#1a1a1a",
  border: "#262626", borderLight: "#363636",
  text: "#F5F5F5", textSec: "#A8A8A8", textMuted: "#737373",
  accent: "#0095F6", accentHover: "#1AA1F7",
  gradient: "linear-gradient(45deg, #F58529, #DD2A7B, #8134AF, #515BD4)",
  red: "#FF3040", green: "#10B981", yellow: "#F59E0B", purple: "#8B5CF6",
};

const inputBase = {
  width:"100%", background:C.bg, border:`1px solid ${C.border}`,
  borderRadius:10, padding:"10px 12px", color:C.text, fontSize:13,
  outline:"none", fontFamily:"inherit", boxSizing:"border-box",
};
const selectBase = { ...inputBase, appearance:"auto" };

// ═══════════════════════════════════════════════════════════════════════════
// AUTH SCREEN
// ═══════════════════════════════════════════════════════════════════════════
function AuthScreen({ onAuth }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleLogin = () => {
    if (pw === CONFIG.TEAM_PASSWORD) {
      localStorage.setItem("doki_auth", "1");
      onAuth();
    } else {
      setErr(true);
      setTimeout(() => setErr(false), 1500);
    }
  };

  return (
    <div style={{
      background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", padding: 24, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    }}>
      <div style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 20,
        padding: 32, width: "100%", maxWidth: 360, textAlign: "center",
        animation: "slideUp 0.5s ease"
      }}>
        <div style={{
          background: C.gradient, borderRadius: 16, width: 56, height: 56,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px", fontSize: 22, fontWeight: 900, color: "#fff"
        }}>D</div>
        <h1 style={{ color: C.text, fontSize: 22, fontWeight: 700, margin: "0 0 4px", letterSpacing: -0.5 }}>Doki Hub</h1>
        <p style={{ color: C.textMuted, fontSize: 13, margin: "0 0 24px" }}>Influencer Command Center</p>

        <div style={{ position: "relative", marginBottom: 16 }}>
          <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.textMuted }}>{I.lock}</div>
          <input
            type={showPw ? "text" : "password"}
            value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            placeholder="Team password"
            style={{
              ...inputBase, borderRadius: 12, padding: "14px 44px 14px 40px", fontSize: 15,
              borderColor: err ? C.red : C.border,
              transition: "border-color 0.3s"
            }}
          />
          <button onClick={() => setShowPw(!showPw)} style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", color: C.textMuted, cursor: "pointer", padding: 0
          }}>{showPw ? I.eyeOff : I.eye}</button>
        </div>

        {err && <p style={{ color: C.red, fontSize: 13, margin: "0 0 12px", animation: "fadeIn 0.2s" }}>Wrong password. Try again.</p>}

        <button onClick={handleLogin} style={{
          width: "100%", background: C.accent, color: "#fff", border: "none",
          borderRadius: 12, padding: 14, fontWeight: 700, fontSize: 15,
          cursor: "pointer", transition: "background 0.2s"
        }}>Enter</button>

        <p style={{ color: C.textMuted, fontSize: 11, marginTop: 16 }}>
          Ask your team lead for access
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════
// ─── Seed Prospects ──────────────────────────────────────────────────────────
const SEED_PROSPECTS = [
  { handle: "@ishaaan.fit", name: "Ishaan Fit", followers: 2200, eng: 15, niche: "Fitness & Health", costPerDeliv: 10000, numDelivs: 1, note: "Gym POVs + fitness tips + running content · Viral reels (2.6M, 536K, 333K) · Huge reach for nano account" },
  { handle: "@sanikavaid", name: "Sanika Vaid", followers: 8000, niche: "Fitness & Health", costPerDeliv: 0, numDelivs: 0 },
  { handle: "@gauravovereats", name: "Gaurav Makkar", followers: 46200, niche: "Food & Snacks", costPerDeliv: 0, numDelivs: 0 },
  { handle: "@coachamogh", name: "Coach Amogh", followers: 2200, niche: "Fitness & Health", costPerDeliv: 0, numDelivs: 0 },
  { handle: "@drharshkanwar", name: "Harsh Kanwar", followers: 75000, niche: "Fitness & Health", costPerDeliv: 50000, numDelivs: 1, note: "Pre-negotiated" },
  { handle: "@sid.shettyyy", name: "Siddhant Shetty", followers: 18000, niche: "Comedy", costPerDeliv: 18000, numDelivs: 1, note: "Pre-negotiated" },
  { handle: "@ctrlplusrage", name: "Avinash Vaibhav", followers: 23600, niche: "Fitness & Health", costPerDeliv: 0, numDelivs: 0 },
  { handle: "@aasttha.s", name: "Aasttha Ssidana", followers: 118000, niche: "Lifestyle", costPerDeliv: 0, numDelivs: 0 },
  { handle: "@sheenafit", name: "Sheena Roy", followers: 92200, niche: "Fitness & Health", costPerDeliv: 0, numDelivs: 0 },
  { handle: "@nutritionwith_khushi", name: "Khushi Chhabra", followers: 150000, niche: "Nutritionist", costPerDeliv: 0, numDelivs: 0 },
  { handle: "@melrose_rebeiro", name: "Melrose Rebeiro", followers: 76500, niche: "Leadership", costPerDeliv: 0, numDelivs: 0 },
  { handle: "@chaardiwaari", name: "Chaar Diwari", followers: 404000, niche: "Music", costPerDeliv: 0, numDelivs: 0 },
  { handle: "@nutellaonella", name: "Onella Rodriguez", followers: 321000, niche: "Lifestyle", costPerDeliv: 0, numDelivs: 0 },
  { handle: "@ashnamalik", name: "Ashna Malik", followers: 7000, niche: "Music", costPerDeliv: 0, numDelivs: 0 },
  { handle: "@suhanananda", name: "Suhana Nanda", followers: 65000, niche: "Food & Snacks", costPerDeliv: 0, numDelivs: 0 },
  { handle: "@aditiwhyy", name: "Aditiwhy", followers: 4000, niche: "Information", costPerDeliv: 0, numDelivs: 0 },
  { handle: "@malikkaadvani", name: "Malikka Advani", followers: 5000, niche: "Comedy", costPerDeliv: 0, numDelivs: 0 },
  { handle: "@vanshmor", name: "Vansh Mor", followers: 9800, niche: "Fitness & Health", costPerDeliv: 0, numDelivs: 0 },
  { handle: "@taashithukrall", name: "Taashi Thukrall", followers: 15000, niche: "Comedy", costPerDeliv: 0, numDelivs: 0, note: "Ex-Subko" },
  { handle: "@krishnahujaa", name: "Krishn Ahuja", followers: 28000, niche: "Comedy", costPerDeliv: 0, numDelivs: 0, note: "Impression comedy" },
  { handle: "@myliteraryexperiment", name: "Myliteraryexperiment", followers: 88000, niche: "Reading", costPerDeliv: 0, numDelivs: 0 },
  { handle: "@thefitmomedit", name: "TheFitMomEdit", followers: 10000, niche: "Mom Content", costPerDeliv: 0, numDelivs: 0 },
  { handle: "@_sangym_", name: "Sanjum Singh Dhaliwal", followers: 20000, eng: 25, niche: "Comedy", costPerDeliv: 0, numDelivs: 0, note: "Verified ✅ · UCLA/Amritsar · Viral reels (1M-5M views) · Food highlight · Avg ~900K views on 20K followers" },
];

function buildSeedPipeline() {
  const pipeline = {};
  const notes = {};
  SEED_PROSPECTS.forEach((p, i) => {
    const id = "seed_" + i;
    pipeline[id] = {
      id, handle: p.handle, name: p.name, followers: p.followers,
      eng: p.eng || 0, avgLikes: 0, avgComments: 0,
      niche: p.niche, location: "—",
      posts: 0, following: 0, similarity: 0, verified: false, growth: 0,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.name)}&backgroundColor=262626&textColor=ffffff&fontSize=36`,
      stage: "Prospect", addedAt: Date.now() - (SEED_PROSPECTS.length - i) * 1000,
      costPerDeliv: p.costPerDeliv || 0,
      numDelivs: p.numDelivs || 0,
    };
    if (p.note) notes[id] = p.note;
  });
  return { pipeline, notes };
}

export default function App() {
  const [authed, setAuthed] = useState(() => localStorage.getItem("doki_auth") === "1");
  const [tab, setTab] = useState("discover");
  const [discoveredList, setDiscoveredList] = useState([]);
  const [pipeline, setPipeline] = useState(() => {
    const saved = load("doki_pipeline", {});
    if (Object.keys(saved).length === 0) {
      const seed = buildSeedPipeline();
      save("doki_notes", seed.notes);
      return seed.pipeline;
    }
    // Rename old handles to corrected ones
    const HANDLE_RENAMES = {
      "@ishaanfit":"@ishaaan.fit", "@gauravmakkar":"@gauravovereats", "@harshkanwar":"@drharshkanwar",
      "@siddhantshetty":"@sid.shettyyy", "@avinashvaibhav":"@ctrlplusrage", "@aastthhassidana":"@aasttha.s",
      "@sheenaroy":"@sheenafit", "@khushichhabra":"@nutritionwith_khushi", "@melroserebeiro":"@melrose_rebeiro",
      "@chaardiwari":"@chaardiwaari", "@onellarodriguez":"@nutellaonella", "@aditiwhy":"@aditiwhyy",
      "@vansh.mor":"@vanshmor", "@krishnahuja":"@krishnahujaa",
    };
    let dirty = false;
    const updated = { ...saved };
    // Apply handle renames
    Object.values(updated).forEach(entry => {
      if (HANDLE_RENAMES[entry.handle]) {
        entry.handle = HANDLE_RENAMES[entry.handle];
        entry.avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(entry.handle)}&backgroundColor=262626&textColor=ffffff&fontSize=36`;
        dirty = true;
      }
    });
    // Remove entries not in the current seed list
    const seedHandles = SEED_PROSPECTS.map(sp => sp.handle);
    Object.keys(updated).forEach(id => {
      if (!seedHandles.includes(updated[id].handle)) {
        delete updated[id];
        dirty = true;
      }
    });
    // Auto-inject missing prospects
    const handles = Object.values(updated).map(e => e.handle);
    const missing = SEED_PROSPECTS.filter(sp => !handles.includes(sp.handle));
    missing.forEach((sp, i) => {
      dirty = true;
      const id = "inject_" + Date.now() + "_" + i;
      updated[id] = {
        id, handle: sp.handle, name: sp.name || sp.handle.replace("@",""),
        followers: sp.followers || 0, eng: sp.eng || 0, avgLikes: 0, avgComments: 0,
        niche: sp.niche || "—", location: "—", posts: 0, following: 0,
        similarity: 0, verified: false, growth: 0,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(sp.handle)}&backgroundColor=262626&textColor=ffffff&fontSize=36`,
        stage: "Prospect", addedAt: Date.now(),
        costPerDeliv: sp.costPerDeliv || 0, numDelivs: sp.numDelivs || 0,
        assignedTo: "",
      };
      if (sp.note) {
        const n = load("doki_notes", {});
        n[id] = sp.note;
        save("doki_notes", n);
      }
    });
    // Sync eng% and niche from seed data for existing entries
    SEED_PROSPECTS.forEach(sp => {
      const entry = Object.values(updated).find(e => e.handle === sp.handle);
      if (entry) {
        if (sp.eng && (!entry.eng || entry.eng === 0)) { entry.eng = sp.eng; dirty = true; }
        if (sp.niche && entry.niche !== sp.niche && (entry.niche === "—" || entry.niche === "Comedy" && sp.niche !== "Comedy")) { entry.niche = sp.niche; dirty = true; }
        if (sp.note) {
          const n = load("doki_notes", {});
          if (!n[entry.id]) { n[entry.id] = sp.note; save("doki_notes", n); }
        }
      }
    });
    if (dirty) {
      save("doki_pipeline", updated);
      return updated;
    }
    return saved;
  });
  const [payments, setPayments] = useState(() => load("doki_payments", []));
  const [notes, setNotes] = useState(() => {
    const saved = load("doki_notes", {});
    if (Object.keys(saved).length === 0) {
      return buildSeedPipeline().notes;
    }
    return saved;
  });
  const [deliverables, setDeliverables] = useState(() => load("doki_deliverables", {}));
  const [discountCodes, setDiscountCodes] = useState(() => load("doki_codes", {}));
  const [selectedInf, setSelectedInf] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => save("doki_pipeline", pipeline), [pipeline]);
  useEffect(() => save("doki_payments", payments), [payments]);
  useEffect(() => save("doki_notes", notes), [notes]);
  useEffect(() => save("doki_deliverables", deliverables), [deliverables]);
  useEffect(() => save("doki_codes", discountCodes), [discountCodes]);

  const addToPipeline = useCallback(inf => {
    setPipeline(p => ({ ...p, [inf.id]: { ...inf, stage: "Prospect", addedAt: Date.now() } }));
  }, []);
  const updateStage = useCallback((id, stage) => {
    setPipeline(p => ({ ...p, [id]: { ...p[id], stage } }));
  }, []);
  const removeFromPipeline = useCallback(id => {
    setPipeline(p => { const n = { ...p }; delete n[id]; return n; });
  }, []);
  const addPayment = useCallback(pay => {
    setPayments(p => [...p, { ...pay, id: "pay_" + Date.now(), createdAt: Date.now() }]);
  }, []);
  const removePayment = useCallback(payId => {
    setPayments(p => p.filter(x => x.id !== payId));
  }, []);
  const updateNote = useCallback((infId, text) => {
    setNotes(p => ({ ...p, [infId]: text }));
  }, []);
  const updateDeliverable = useCallback((infId, field, value) => {
    setDeliverables(p => ({ ...p, [infId]: { ...(p[infId] || {}), [field]: value } }));
  }, []);
  const updateDiscountCode = useCallback((infId, code) => {
    setDiscountCodes(p => ({ ...p, [infId]: code }));
  }, []);
  const openDetail = useCallback(inf => { setSelectedInf(inf); setShowDetail(true); }, []);
  const closeDetail = useCallback(() => { setShowDetail(false); setTimeout(() => setSelectedInf(null), 300); }, []);

  if (!authed) return <AuthScreen onAuth={() => setAuthed(true)} />;

  const pipelineCount = Object.keys(pipeline).length;
  const totalSpend = payments.reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div style={{
      background: C.bg, color: C.text, minHeight: "100vh",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      display: "flex", flexDirection: "row",
      position: "relative", fontSize: 14, lineHeight: 1.4
    }}>
      {/* Sidebar Nav */}
      <div style={{
        width: 220, minHeight: "100vh", background: "#0a0a0a",
        borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0, zIndex: 100
      }}>
        <div style={{ padding: "20px 16px 16px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{
              background: C.gradient, borderRadius: 10, width: 36, height: 36,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 15, color: "#fff"
            }}>D</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: -0.5 }}>Doki Hub</div>
              {CONFIG.IG_ACCESS_TOKEN && (
                <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: C.green, fontWeight: 600 }}>
                  {I.live} API Live
                </span>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 11, color: C.textSec }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{pipelineCount}</span>
              <span style={{ marginLeft: 4 }}>Pipeline</span>
            </div>
            <div>
              <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{inr(totalSpend)}</span>
              <span style={{ marginLeft: 4 }}>Spent</span>
            </div>
          </div>
        </div>

        <div style={{ padding: "12px 8px", flex: 1 }}>
          {[
            { id: "discover", icon: I.discover, label: "Discover" },
            { id: "foryou", icon: I.star, label: "For You" },
            { id: "pipeline", icon: I.pipeline, label: "Pipeline" },
            { id: "spend", icon: I.money, label: "Spend" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              width: "100%", background: tab === t.id ? C.accent + "18" : "transparent",
              border: "none", color: tab === t.id ? C.text : C.textMuted,
              display: "flex", alignItems: "center", gap: 10,
              cursor: "pointer", padding: "10px 12px", borderRadius: 10,
              transition: "all 0.2s", marginBottom: 2, fontSize: 14, fontWeight: tab === t.id ? 600 : 400,
              textAlign: "left"
            }}>
              <div style={{ opacity: tab === t.id ? 1 : 0.5 }}>{t.icon}</div>
              <span>{t.label}</span>
              {tab === t.id && <div style={{ width: 4, height: 16, borderRadius: 2, background: C.accent, marginLeft: "auto" }} />}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, marginLeft: 220, minHeight: "100vh", overflowY: "auto" }}>
        {tab === "discover" && <DiscoverTab list={discoveredList} setList={setDiscoveredList} pipeline={pipeline} addToPipeline={addToPipeline} openDetail={openDetail} />}
        {tab === "foryou" && <ForYouTab pipeline={pipeline} payments={payments} addToPipeline={addToPipeline} openDetail={openDetail} />}
        {tab === "pipeline" && <PipelineTab pipeline={pipeline} setPipeline={setPipeline} updateStage={updateStage} remove={removeFromPipeline} notes={notes} updateNote={updateNote} payments={payments} addPayment={addPayment} openDetail={openDetail} deliverables={deliverables} updateDeliverable={updateDeliverable} discountCodes={discountCodes} updateDiscountCode={updateDiscountCode} setTab={setTab} />}
        {tab === "spend" && <SpendTab pipeline={pipeline} payments={payments} addPayment={addPayment} removePayment={removePayment} updatePayment={(payId, updates) => setPayments(p => p.map(x => x.id === payId ? { ...x, ...updates } : x))} deliverables={deliverables} notes={notes} addToPipeline={addToPipeline} setTab={setTab} />}
      </div>

      {/* Detail Modal */}
      {selectedInf && <DetailModal inf={selectedInf} show={showDetail} onClose={closeDetail} pipeline={pipeline} addToPipeline={addToPipeline} updateStage={updateStage} notes={notes} updateNote={updateNote} payments={payments} deliverables={deliverables} updateDeliverable={updateDeliverable} discountCodes={discountCodes} updateDiscountCode={updateDiscountCode} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FOR YOU TAB — Recommendations + Brand Collab Search
// ═══════════════════════════════════════════════════════════════════════════
function ForYouTab({ pipeline, payments, addToPipeline, openDetail }) {
  const [section, setSection] = useState("recs");
  const [brandQuery, setBrandQuery] = useState("");
  const [brandLoading, setBrandLoading] = useState(false);
  const [brandResults, setBrandResults] = useState(null);
  const [recCandidates] = useState(() => genDemo("recommendations_pool_v2"));

  const recs = useMemo(() => getRecommendations(pipeline, payments, recCandidates), [pipeline, payments, recCandidates]);

  const doBrandSearch = useCallback(async () => {
    const q = brandQuery.trim().replace("@", "");
    if (!q) return;
    setBrandLoading(true);
    setBrandResults(null);

    if (CONFIG.IG_ACCESS_TOKEN) {
      const result = await fetchBrandCollabs(q);
      if (!result.error && result.collabs.length > 0) {
        setBrandResults(result);
        setBrandLoading(false);
        return;
      }
    }
    // Fallback to demo data
    setTimeout(() => {
      setBrandResults({
        collabs: genDemoBrandCollabs(q),
        brandInfo: { username: q, name: q.charAt(0).toUpperCase() + q.slice(1), followers: Math.floor(50000 + Math.random() * 500000) },
        totalPosts: 50,
        error: CONFIG.IG_ACCESS_TOKEN ? null : "demo"
      });
      setBrandLoading(false);
    }, 600 + Math.random() * 400);
  }, [brandQuery]);

  return (
    <div style={{ padding: 16 }}>
      {/* Section Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 16, background: C.card, borderRadius: 12, padding: 3, border: `1px solid ${C.border}` }}>
        {[["recs", "✨ Recommended"], ["brand", "🏷 Brand Search"]].map(([id, label]) => (
          <button key={id} onClick={() => setSection(id)} style={{
            flex: 1, background: section === id ? C.accent : "transparent",
            color: section === id ? "#fff" : C.textMuted,
            border: "none", borderRadius: 10, padding: "10px 0",
            fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s"
          }}>{label}</button>
        ))}
      </div>

      {/* ─── Recommendations Section ─── */}
      {section === "recs" && (
        <>
          {recs.reason === "empty" ? (
            <div style={{ textAlign: "center", padding: "40px 24px", color: C.textMuted }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✨</div>
              <div style={{ fontWeight: 600, color: C.textSec, marginBottom: 6, fontSize: 16 }}>Smart Recommendations</div>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                Add influencers to your pipeline first — I'll learn your preferences and recommend similar high-performing creators
              </div>
            </div>
          ) : (
            <>
              {/* Insight Banner */}
              <div style={{
                background: `linear-gradient(135deg, ${C.purple}15, ${C.accent}15)`,
                border: `1px solid ${C.purple}33`, borderRadius: 14, padding: 14, marginBottom: 16
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                  📊 Based on your pipeline
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {recs.topNiches?.map(n => (
                    <span key={n} style={{ fontSize: 11, background: C.purple+"22", color: C.purple, padding: "3px 8px", borderRadius: 8, fontWeight: 600 }}>{n}</span>
                  ))}
                  {recs.topLocations?.map(l => (
                    <span key={l} style={{ fontSize: 11, background: C.accent+"22", color: C.accent, padding: "3px 8px", borderRadius: 8, fontWeight: 600 }}>{l}</span>
                  ))}
                  <span style={{ fontSize: 11, background: C.green+"22", color: C.green, padding: "3px 8px", borderRadius: 8, fontWeight: 600 }}>
                    ~{recs.avgEng}% avg eng
                  </span>
                  {recs.highROICount > 0 && (
                    <span style={{ fontSize: 11, background: C.yellow+"22", color: C.yellow, padding: "3px 8px", borderRadius: 8, fontWeight: 600 }}>
                      {recs.highROICount} high-ROI match{recs.highROICount > 1 ? "es" : ""}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 8, lineHeight: 1.5 }}>
                  Recommendations weighted by niche match, engagement quality, follower similarity{recs.highROICount > 0 ? ", and high-ROI influencer patterns" : ""}
                </div>
              </div>

              {/* Recommended Cards */}
              <Label>Top Picks for Doki ({recs.recommended.length})</Label>
              {recs.recommended.map(inf => (
                <InfCard key={inf.id} inf={inf} onTap={() => openDetail(inf)}
                  inPipeline={!!pipeline[inf.id]} onAdd={() => addToPipeline(inf)} />
              ))}
              {recs.recommended.length === 0 && (
                <div style={{ textAlign: "center", padding: 24, color: C.textMuted, fontSize: 13 }}>
                  All recommendations are already in your pipeline! Great work 🎯
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ─── Brand Collab Search Section ─── */}
      {section === "brand" && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <div style={{
              flex: 1, display: "flex", alignItems: "center", gap: 8,
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "0 12px"
            }}>
              <span style={{ color: C.textMuted }}>{I.brand}</span>
              <input value={brandQuery} onChange={e => setBrandQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && doBrandSearch()}
                placeholder="Enter brand handle..."
                style={{ flex:1, background:"none", border:"none", color:C.text, padding:"12px 0", fontSize:14, outline:"none" }}
              />
            </div>
            <button onClick={doBrandSearch} style={{
              background: C.accent, color: "#fff", border: "none", borderRadius: 12,
              padding: "0 18px", fontWeight: 600, fontSize: 14, cursor: "pointer"
            }}>Search</button>
          </div>

          {/* Loading */}
          {brandLoading && (
            <div style={{ textAlign: "center", padding: 40 }}>
              <div style={{ width:36, height:36, border:`3px solid ${C.border}`, borderTopColor:C.accent, borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
              <div style={{ color: C.textSec, fontSize: 13 }}>Scanning brand collaborations...</div>
            </div>
          )}

          {/* Empty State */}
          {!brandLoading && !brandResults && (
            <div style={{ textAlign: "center", padding: "40px 24px", color: C.textMuted }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🏷</div>
              <div style={{ fontWeight: 600, color: C.textSec, marginBottom: 6, fontSize: 16 }}>Brand Collab Search</div>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                Enter a competitor or brand handle to see which influencers they've collaborated with
                {!CONFIG.IG_ACCESS_TOKEN && (
                  <div style={{ marginTop: 8, color: C.yellow, fontSize: 12 }}>
                    ⚠️ Connect Instagram API for real collab data. Currently showing demo results.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Brand Results */}
          {!brandLoading && brandResults && (
            <>
              {/* Brand Info Header */}
              {brandResults.brandInfo && (
                <div style={{
                  background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
                  padding: 16, marginBottom: 16, display: "flex", alignItems: "center", gap: 12
                }}>
                  {brandResults.brandInfo.avatar ? (
                    <img src={brandResults.brandInfo.avatar} style={{ width: 48, height: 48, borderRadius: "50%", background: C.bg }} alt=""
                      onError={e => { e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${brandResults.brandInfo.username}&backgroundColor=262626&textColor=ffffff`; }} />
                  ) : (
                    <div style={{ width:48, height:48, borderRadius:"50%", background:C.gradient, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:800, color:"#fff" }}>
                      {brandResults.brandInfo.username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>@{brandResults.brandInfo.username}</div>
                    <div style={{ fontSize: 12, color: C.textSec }}>
                      {brandResults.brandInfo.followers ? fmt(brandResults.brandInfo.followers) + " followers" : brandResults.brandInfo.name}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: C.accent }}>{brandResults.collabs.length}</div>
                    <div style={{ fontSize: 10, color: C.textMuted }}>collabs found</div>
                  </div>
                </div>
              )}

              {brandResults.error === "demo" && (
                <div style={{ background: C.yellow+"15", border: `1px solid ${C.yellow}33`, borderRadius: 10, padding: 10, marginBottom: 12, fontSize: 12, color: C.yellow, textAlign: "center" }}>
                  📋 Showing demo data — connect Instagram API for real collab detection
                </div>
              )}

              {/* Collab List */}
              {brandResults.collabs.length > 0 ? (
                <>
                  <Label>Influencers who collaborated with @{brandResults.brandInfo?.username}</Label>
                  {brandResults.collabs.map((collab, i) => (
                    <div key={collab.handle + i} style={{
                      background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
                      padding: 14, marginBottom: 8, display: "flex", alignItems: "center", gap: 12
                    }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: "50%", background: C.gradient + "44",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0
                      }}>
                        #{i+1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{collab.handle}</div>
                        <div style={{ display: "flex", gap: 10, marginTop: 4, fontSize: 12, color: C.textSec, flexWrap: "wrap" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                            <span style={{ background: C.accent+"22", color: C.accent, padding: "1px 6px", borderRadius: 6, fontWeight: 700, fontSize: 11 }}>
                              {collab.collabCount}x
                            </span>
                            collabs
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                            {I.heart} {fmt(collab.totalLikes)}
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                            {I.comment} {fmt(collab.totalComments)}
                          </span>
                        </div>
                        {collab.posts.length > 0 && (
                          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>
                            Latest: {new Date(collab.posts[0].timestamp).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>
                          {fmt(collab.totalLikes + collab.totalComments)}
                        </div>
                        <div style={{ fontSize: 10, color: C.textMuted }}>total eng</div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div style={{ textAlign: "center", padding: 24, color: C.textMuted, fontSize: 13 }}>
                  No collaborations found for this brand. Try another handle.
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DISCOVER TAB
// ═══════════════════════════════════════════════════════════════════════════
function DiscoverTab({ list, setList, pipeline, addToPipeline, openDetail }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiProfile, setApiProfile] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    niche:"", location:"", minFollowers:"", maxFollowers:"", minEng:"", maxEng:"", sortBy:"similarity"
  });

  const doSearch = useCallback(async () => {
    const q = query.trim().replace("@", "");
    if (!q) return;
    setLoading(true);
    setApiProfile(null);
    setList([]);

    // 1 — fetch profile first and show immediately
    let profile = await fetchRapidProfile(q);
    if (!profile && CONFIG.IG_ACCESS_TOKEN) profile = await fetchIGProfile(q);
    if (profile) setApiProfile(profile);

    // 2 — small delay to avoid 429 rate limit, then fetch similar accounts
    await sleep(1500);
    const similar = await fetchRapidSimilar(q);
    setList(similar); // show real results (empty = no similar found), never fake demo

    setLoading(false);
  }, [query, setList]);

  const filtered = useMemo(() => {
    let f = [...list];
    if (filters.niche) f = f.filter(i => i.niche === filters.niche);
    if (filters.location) f = f.filter(i => i.location.includes(filters.location));
    if (filters.minFollowers) f = f.filter(i => i.followers >= +filters.minFollowers);
    if (filters.maxFollowers) f = f.filter(i => i.followers <= +filters.maxFollowers);
    if (filters.minEng) f = f.filter(i => i.eng >= +filters.minEng);
    if (filters.maxEng) f = f.filter(i => i.eng <= +filters.maxEng);
    const s = filters.sortBy;
    if (s === "similarity") f.sort((a,b) => b.similarity - a.similarity);
    else if (s === "followers") f.sort((a,b) => b.followers - a.followers);
    else if (s === "engagement") f.sort((a,b) => b.eng - a.eng);
    else if (s === "growth") f.sort((a,b) => b.growth - a.growth);
    return f;
  }, [list, filters]);

  return (
    <div style={{ padding: 16 }}>
      {/* Search */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div style={{
          flex: 1, display: "flex", alignItems: "center", gap: 8,
          background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "0 12px"
        }}>
          <span style={{ color: C.textMuted }}>{I.search}</span>
          <input value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && doSearch()}
            placeholder="Search @handle..."
            style={{ flex:1, background:"none", border:"none", color:C.text, padding:"12px 0", fontSize:14, outline:"none" }}
          />
        </div>
        <button onClick={doSearch} style={{
          background: C.accent, color: "#fff", border: "none", borderRadius: 12,
          padding: "0 18px", fontWeight: 600, fontSize: 14, cursor: "pointer"
        }}>Search</button>
      </div>

      {/* Filter Toggle */}
      <button onClick={() => setShowFilters(!showFilters)} style={{
        background: showFilters ? C.accent+"22" : C.card,
        border: `1px solid ${showFilters ? C.accent : C.border}`,
        color: showFilters ? C.accent : C.textSec, borderRadius: 20,
        padding: "6px 14px", fontSize: 12, cursor: "pointer",
        display: "flex", alignItems: "center", gap: 6, marginBottom: 12, fontWeight: 500
      }}>{I.filter} Filters {filtered.length > 0 && `(${filtered.length})`}</button>

      {/* Filters */}
      {showFilters && (
        <div style={{
          background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
          padding: 16, marginBottom: 16, animation: "fadeIn 0.2s ease"
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Sel label="Niche" value={filters.niche} onChange={v => setFilters(f=>({...f,niche:v}))} options={NICHES} />
            <Sel label="Location" value={filters.location} onChange={v => setFilters(f=>({...f,location:v}))} options={LOCATIONS} />
            <Inp label="Min Followers" value={filters.minFollowers} onChange={v => setFilters(f=>({...f,minFollowers:v}))} ph="e.g. 10000" />
            <Inp label="Max Followers" value={filters.maxFollowers} onChange={v => setFilters(f=>({...f,maxFollowers:v}))} ph="e.g. 500000" />
            <Inp label="Min Eng %" value={filters.minEng} onChange={v => setFilters(f=>({...f,minEng:v}))} ph="e.g. 2" />
            <Inp label="Max Eng %" value={filters.maxEng} onChange={v => setFilters(f=>({...f,maxEng:v}))} ph="e.g. 10" />
          </div>
          <div style={{ marginTop: 12 }}>
            <Label>Sort By</Label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[["similarity","Match %"],["followers","Followers"],["engagement","Eng Rate"],["growth","Growth"]].map(([v,l]) => (
                <button key={v} onClick={() => setFilters(f=>({...f,sortBy:v}))} style={{
                  background: filters.sortBy===v ? C.accent : C.bg,
                  color: filters.sortBy===v ? "#fff" : C.textSec,
                  border: `1px solid ${filters.sortBy===v ? C.accent : C.border}`,
                  borderRadius: 16, padding: "5px 12px", fontSize: 12, cursor: "pointer", fontWeight: 500
                }}>{l}</button>
              ))}
            </div>
          </div>
          <button onClick={() => setFilters({niche:"",location:"",minFollowers:"",maxFollowers:"",minEng:"",maxEng:"",sortBy:"similarity"})}
            style={{ marginTop: 10, background:"none", border:"none", color:C.red, fontSize:12, cursor:"pointer", fontWeight:500 }}>
            Clear all filters
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ width:36, height:36, border:`3px solid ${C.border}`, borderTopColor:C.accent, borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
          <div style={{ color: C.textSec, fontSize: 13 }}>Finding similar creators...</div>
        </div>
      )}

      {/* Real API Profile Card */}
      {!loading && apiProfile && (
        <div style={{ marginBottom: 16 }}>
          <Label style={{ color: C.green }}>📡 Live from Instagram</Label>
          <InfCard inf={apiProfile} onTap={() => openDetail(apiProfile)}
            inPipeline={!!pipeline[apiProfile.id]} onAdd={() => addToPipeline(apiProfile)} highlight />
        </div>
      )}

      {/* Empty — no search yet */}
      {!loading && list.length === 0 && !apiProfile && (
        <div style={{ textAlign: "center", padding: "48px 24px", color: C.textMuted }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div style={{ fontWeight: 600, color: C.textSec, marginBottom: 6, fontSize: 16 }}>Discover Influencers</div>
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>
            Enter a handle like <span style={{ color: C.accent }}>@foodpharmer</span> to find similar creators
            {CONFIG.IG_ACCESS_TOKEN && <><br/><span style={{ color: C.green }}>✓ Live Instagram data enabled via @dokimeats</span></>}
          </div>
        </div>
      )}

      {/* Empty — profile found but no similar accounts from API */}
      {!loading && list.length === 0 && apiProfile && (
        <div style={{ textAlign: "center", padding: "32px 24px", color: C.textMuted }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>😶</div>
          <div style={{ fontWeight: 600, color: C.textSec, marginBottom: 6, fontSize: 14 }}>No similar accounts found</div>
          <div style={{ fontSize: 12, lineHeight: 1.6 }}>
            Instagram didn't return similar creators for this account.<br/>
            Try a bigger account like <span style={{ color: C.accent }}>@foodpharmer</span> or <span style={{ color: C.accent }}>@fittuber</span>
          </div>
        </div>
      )}

      {/* Similar Results */}
      {!loading && filtered.length > 0 && (
        <>
          {apiProfile && <Label>Similar Creators</Label>}
          {filtered.map(inf => (
            <InfCard key={inf.id} inf={inf} onTap={() => openDetail(inf)}
              inPipeline={!!pipeline[inf.id]} onAdd={() => addToPipeline(inf)} />
          ))}
        </>
      )}
    </div>
  );
}

// ─── Influencer Card ────────────────────────────────────────────────────────
function InfCard({ inf, onTap, inPipeline, onAdd, highlight }) {
  const engRating = getEngRating(inf.followers, inf.eng);
  return (
    <div onClick={onTap} style={{
      background: highlight ? C.accent+"0a" : C.card,
      border: `1px solid ${highlight ? C.accent+"44" : C.border}`,
      borderRadius: 16, padding: 14, marginBottom: 8, cursor: "pointer",
      transition: "all 0.2s", display: "flex", gap: 12, alignItems: "center"
    }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", padding: 2, background: highlight ? C.accent : C.gradient }}>
          <img src={inf.avatar} style={{ width: 48, height: 48, borderRadius: "50%", background: C.bg, display: "block" }} alt=""
            onError={e => { e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${inf.handle}&backgroundColor=262626&textColor=ffffff`; }} />
        </div>
        {inf.verified && <div style={{ position:"absolute", bottom:-1, right:-1 }}>{I.verified}</div>}
        {inf.isReal && <div style={{ position:"absolute", top:-2, left:-2, background:C.green, borderRadius:6, padding:"1px 4px", fontSize:8, fontWeight:700, color:"#fff" }}>LIVE</div>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inf.handle}</span>
          {inf.similarity > 0 && <span style={{ fontSize:11, color:C.accent, fontWeight:600, background:C.accent+"18", padding:"1px 6px", borderRadius:8 }}>{inf.similarity}%</span>}
        </div>
        <div style={{ fontSize: 12, color: C.textSec, marginTop: 1 }}>
          {inf.niche !== "—" ? inf.niche : ""}{inf.niche !== "—" && inf.location !== "—" ? " · " : ""}{inf.location !== "—" ? inf.location : ""}
          {inf.bio && inf.niche === "—" && <span>{inf.bio.substring(0, 50)}</span>}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 6, fontSize: 12, alignItems: "center" }}>
          <span style={{ color: C.textSec }}><strong style={{ color: C.text }}>{fmt(inf.followers)}</strong> followers</span>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <strong style={{ color: C.text }}>{inf.eng}%</strong>
            <span style={{ fontSize: 10, fontWeight: 700, color: engRating.color, background: engRating.color+"22", padding: "1px 5px", borderRadius: 6 }}>
              {engRating.emoji} {engRating.label}
            </span>
          </span>
          {inf.growth !== 0 && (
            <span style={{ display:"flex", alignItems:"center", gap:2 }}>
              {inf.growth >= 0 ? I.up : I.down}
              <span style={{ color: inf.growth >= 0 ? C.green : C.red, fontWeight: 600 }}>{Math.abs(inf.growth)}%</span>
            </span>
          )}
        </div>
      </div>
      <button onClick={e => { e.stopPropagation(); if (!inPipeline) onAdd(); }} style={{
        background: inPipeline ? C.green+"22" : C.accent,
        color: inPipeline ? C.green : "#fff",
        border: inPipeline ? `1px solid ${C.green}44` : "none",
        borderRadius: 10, padding: "8px 12px", cursor: inPipeline ? "default" : "pointer",
        display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, flexShrink: 0
      }}>
        {inPipeline ? I.check : I.plus}{inPipeline ? "" : "Add"}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PIPELINE TAB
// ═══════════════════════════════════════════════════════════════════════════
function PipelineTab({ pipeline, setPipeline, updateStage, remove, notes, updateNote, payments, addPayment, openDetail, deliverables, updateDeliverable, discountCodes, updateDiscountCode, setTab }) {
  const [activeStage, setActiveStage] = useState(null);
  const [showAddRow, setShowAddRow] = useState(false);
  const [newRow, setNewRow] = useState({ handle: "", name: "", followers: "", niche: "", location: "", costPerDeliv: "", numDelivs: "1", contactInfo: "", assignedTo: "" });
  const [editingCell, setEditingCell] = useState(null); // {id, field}
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const entries = Object.values(pipeline);
  const grouped = useMemo(() => {
    const g = {}; STAGES.forEach(s => g[s] = []);
    entries.forEach(e => { if(g[e.stage]) g[e.stage].push(e); });
    return g;
  }, [entries]);

  const filteredEntries = useMemo(() => {
    let list = activeStage ? entries.filter(e => e.stage === activeStage) : [...entries];
    if (sortCol) {
      list.sort((a, b) => {
        let va = a[sortCol] ?? "", vb = b[sortCol] ?? "";
        if (sortCol === "followers" || sortCol === "eng" || sortCol === "costPerDeliv" || sortCol === "numDelivs") {
          va = +va || 0; vb = +vb || 0;
        }
        if (sortCol === "proposedBudget") {
          va = (+a.costPerDeliv || 0) * (+a.numDelivs || 0);
          vb = (+b.costPerDeliv || 0) * (+b.numDelivs || 0);
        }
        if (sortCol === "totalPaid") {
          va = payments.filter(p => p.infId === a.id).reduce((s, p) => s + (p.amount || 0), 0);
          vb = payments.filter(p => p.infId === b.id).reduce((s, p) => s + (p.amount || 0), 0);
        }
        if (typeof va === "number") return sortDir === "asc" ? va - vb : vb - va;
        return sortDir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
      });
    }
    return list;
  }, [entries, activeStage, sortCol, sortDir, payments]);

  const handleSort = (col) => {
    if (sortCol === col) { setSortDir(d => d === "asc" ? "desc" : "asc"); }
    else { setSortCol(col); setSortDir("asc"); }
  };

  const handleAddRow = () => {
    if (!newRow.handle.trim()) return;
    const handle = newRow.handle.trim().startsWith("@") ? newRow.handle.trim() : "@" + newRow.handle.trim();
    const id = "manual_" + Date.now();
    const inf = {
      id, handle, name: newRow.name || handle.replace("@", ""),
      followers: +newRow.followers || 0, eng: 0, avgLikes: 0, avgComments: 0,
      niche: newRow.niche || "—", location: newRow.location || "—",
      posts: 0, following: 0, similarity: 0, verified: false, growth: 0,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(handle)}&backgroundColor=262626&textColor=ffffff&fontSize=36`,
      stage: "Prospect", addedAt: Date.now(),
      costPerDeliv: +newRow.costPerDeliv || 0,
      numDelivs: +newRow.numDelivs || 1,
      contactInfo: newRow.contactInfo || "",
      assignedTo: newRow.assignedTo || "",
    };
    setPipeline(p => ({ ...p, [id]: inf }));
    if (newRow.contactInfo) updateNote(id, newRow.contactInfo);
    setNewRow({ handle: "", name: "", followers: "", niche: "", location: "", costPerDeliv: "", numDelivs: "1", contactInfo: "", assignedTo: "" });
    setShowAddRow(false);
  };

  const updateField = (id, field, value) => {
    setPipeline(p => ({ ...p, [id]: { ...p[id], [field]: value } }));
    setEditingCell(null);
  };

  const convertToPaid = (inf) => {
    const totalBudget = (+inf.costPerDeliv || 0) * (+inf.numDelivs || 0);
    if (totalBudget <= 0) {
      alert("Set cost/deliverable and # deliverables before converting.");
      return;
    }
    addPayment({
      infId: inf.id, infName: inf.handle,
      contentType: "Reel", amount: totalBudget,
      engagements: 0, revenue: 0,
      note: `${inf.numDelivs} deliverable${inf.numDelivs > 1 ? "s" : ""} @ ${inr(inf.costPerDeliv)} each`,
      niche: inf.niche, followers: inf.followers,
      costPerDeliv: inf.costPerDeliv, numDelivs: inf.numDelivs,
    });
    remove(inf.id);
    setTab("spend");
  };

  const thStyle = {
    padding: "10px 12px", fontSize: 11, fontWeight: 700, color: C.textMuted,
    textTransform: "uppercase", letterSpacing: 0.5, textAlign: "left",
    borderBottom: `1px solid ${C.border}`, cursor: "pointer", userSelect: "none",
    whiteSpace: "nowrap", position: "sticky", top: 0, background: "#0a0a0a", zIndex: 2
  };
  const tdStyle = {
    padding: "10px 12px", fontSize: 13, borderBottom: `1px solid ${C.border}08`,
    whiteSpace: "nowrap", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis"
  };
  const sortIcon = (col) => sortCol === col ? (sortDir === "asc" ? " ▲" : " ▼") : "";

  return (
    <div style={{ padding: "20px 24px" }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Pipeline</h2>
          <span style={{ fontSize: 13, color: C.textMuted }}>{entries.length} influencer{entries.length !== 1 ? "s" : ""}</span>
        </div>
        <button onClick={() => setShowAddRow(!showAddRow)} style={{
          background: showAddRow ? C.card : C.accent, color: showAddRow ? C.textSec : "#fff",
          border: showAddRow ? `1px solid ${C.border}` : "none", borderRadius: 10,
          padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6
        }}>{showAddRow ? "Cancel" : <>{I.plus} Add Influencer</>}</button>
      </div>

      {/* Niche radar chart */}
      {entries.length >= 3 && (() => {
        const nicheCount = {};
        entries.forEach(e => { const n = e.niche && e.niche !== "—" ? e.niche : "Uncategorized"; nicheCount[n] = (nicheCount[n] || 0) + 1; });
        const radarData = Object.entries(nicheCount).map(([label, value]) => ({ label, value }));
        return (
          <div style={{ marginBottom: 20 }}>
            <RadarChart data={radarData} title="Prospect Niche Distribution" subtitle={`${entries.length} prospects across ${radarData.length} niches — check if you're skewed`} />
          </div>
        );
      })()}

      {/* Tier distribution bar chart */}
      {entries.length > 0 && (() => {
        const tierCount = { Nano: 0, Micro: 0, Mid: 0, Buffer: 0 };
        const tierBudget = { Nano: 0, Micro: 0, Mid: 0, Buffer: 0 };
        entries.forEach(e => {
          const f = e.followers || 0;
          const budget = (+e.costPerDeliv || 0) * (+e.numDelivs || 0);
          if (f < 10000) { tierCount.Nano++; tierBudget.Nano += budget; }
          else if (f < 20000) { tierCount.Micro++; tierBudget.Micro += budget; }
          else if (f < 40000) { tierCount.Mid++; tierBudget.Mid += budget; }
          else { tierCount.Buffer++; tierBudget.Buffer += budget; }
        });
        const maxCount = Math.max(...Object.values(tierCount), 1);
        return (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Pipeline by Tier</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>{entries.length} prospects — how your pipeline stacks up by follower size</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
              {BUDGET_TIERS.map(tier => {
                const count = tierCount[tier.label] || 0;
                const budget = tierBudget[tier.label] || 0;
                const pct = entries.length > 0 ? Math.round((count / entries.length) * 100) : 0;
                const barH = maxCount > 0 ? Math.max(8, (count / maxCount) * 120) : 0;
                return (
                  <div key={tier.label} style={{ textAlign: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginBottom: 8 }}>
                      <div style={{ height: 130, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center" }}>
                        <span style={{ fontSize: 18, fontWeight: 800, color: tier.color }}>{count}</span>
                        <div style={{
                          width: 48, height: barH, background: `linear-gradient(180deg, ${tier.color}, ${tier.color}66)`,
                          borderRadius: "6px 6px 2px 2px", transition: "height 0.4s ease"
                        }} />
                      </div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: tier.color }}>{tier.label}</div>
                    <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{tier.range}</div>
                    <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{pct}% of pipeline</div>
                    {budget > 0 && <div style={{ fontSize: 10, color: C.textSec, marginTop: 2 }}>{inr(budget)} proposed</div>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        <Pill label="All" count={entries.length} color={C.text} active={activeStage === null} onClick={() => setActiveStage(null)} />
        {STAGES.map(s => <Pill key={s} label={s} count={grouped[s].length} color={STAGE_CLR[s]} active={activeStage === s} onClick={() => setActiveStage(activeStage === s ? null : s)} />)}
      </div>

      {/* Add row form */}
      {showAddRow && (
        <div style={{ background: C.card, border: `1px solid ${C.accent}44`, borderRadius: 12, padding: 16, marginBottom: 16, animation: "fadeIn 0.2s" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>Add New Influencer</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr", gap: 10 }}>
            <div>
              <Label>Handle *</Label>
              <input value={newRow.handle} onChange={e => setNewRow(r => ({ ...r, handle: e.target.value }))} placeholder="@handle" style={{ ...inputBase, fontSize: 12 }} onKeyDown={e => e.key === "Enter" && handleAddRow()} />
            </div>
            <div>
              <Label>Name</Label>
              <input value={newRow.name} onChange={e => setNewRow(r => ({ ...r, name: e.target.value }))} placeholder="Full name" style={{ ...inputBase, fontSize: 12 }} />
            </div>
            <div>
              <Label>Followers</Label>
              <input type="number" value={newRow.followers} onChange={e => setNewRow(r => ({ ...r, followers: e.target.value }))} placeholder="e.g. 50000" style={{ ...inputBase, fontSize: 12 }} />
            </div>
            <div>
              <Label>Niche</Label>
              <select value={newRow.niche} onChange={e => setNewRow(r => ({ ...r, niche: e.target.value }))} style={{ ...selectBase, fontSize: 12 }}>
                <option value="">Select...</option>
                {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <Label>Location</Label>
              <select value={newRow.location} onChange={e => setNewRow(r => ({ ...r, location: e.target.value }))} style={{ ...selectBase, fontSize: 12 }}>
                <option value="">Select...</option>
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <Label>Cost / Deliverable</Label>
              <input type="number" value={newRow.costPerDeliv} onChange={e => setNewRow(r => ({ ...r, costPerDeliv: e.target.value }))} placeholder="₹ per video" style={{ ...inputBase, fontSize: 12 }} />
            </div>
            <div>
              <Label># Deliverables</Label>
              <input type="number" value={newRow.numDelivs} onChange={e => setNewRow(r => ({ ...r, numDelivs: e.target.value }))} placeholder="1" style={{ ...inputBase, fontSize: 12 }} min="1" />
            </div>
            <div>
              <Label>Assigned To</Label>
              <select value={newRow.assignedTo} onChange={e => setNewRow(r => ({ ...r, assignedTo: e.target.value }))} style={{ ...selectBase, fontSize: 12 }}>
                <option value="">Select...</option>
                {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <Label>Contact / Notes</Label>
              <input value={newRow.contactInfo} onChange={e => setNewRow(r => ({ ...r, contactInfo: e.target.value }))} placeholder="Phone, email..." style={{ ...inputBase, fontSize: 12 }} />
            </div>
          </div>
          <button onClick={handleAddRow} style={{
            marginTop: 12, background: C.accent, color: "#fff", border: "none", borderRadius: 8,
            padding: "8px 20px", fontWeight: 600, fontSize: 13, cursor: "pointer",
            opacity: newRow.handle.trim() ? 1 : 0.4
          }}>Add to Pipeline</button>
        </div>
      )}

      {/* Spreadsheet table */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1700 }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: 40 }}>#</th>
                <th style={thStyle} onClick={() => handleSort("handle")}>Handle{sortIcon("handle")}</th>
                <th style={thStyle} onClick={() => handleSort("name")}>Name{sortIcon("name")}</th>
                <th style={thStyle} onClick={() => handleSort("followers")}>Followers{sortIcon("followers")}</th>
                <th style={thStyle} onClick={() => handleSort("eng")}>Eng %{sortIcon("eng")}</th>
                <th style={thStyle} onClick={() => handleSort("niche")}>Niche{sortIcon("niche")}</th>
                <th style={{ ...thStyle, minWidth: 200 }}>Problem Solved / Why</th>
                <th style={thStyle}>Best Product</th>
                <th style={thStyle} onClick={() => handleSort("location")}>Location{sortIcon("location")}</th>
                <th style={thStyle} onClick={() => handleSort("stage")}>Stage{sortIcon("stage")}</th>
                <th style={thStyle} onClick={() => handleSort("costPerDeliv")}>Cost/Deliv{sortIcon("costPerDeliv")}</th>
                <th style={thStyle} onClick={() => handleSort("numDelivs")}># Delivs{sortIcon("numDelivs")}</th>
                <th style={thStyle} onClick={() => handleSort("proposedBudget")}>Total Budget{sortIcon("proposedBudget")}</th>
                <th style={thStyle} onClick={() => handleSort("totalPaid")}>Total Paid{sortIcon("totalPaid")}</th>
                <th style={thStyle}>Contact / Notes</th>
                <th style={thStyle}>Assigned To</th>
                <th style={{ ...thStyle, width: 90 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((inf, idx) => {
                const totalPaid = payments.filter(p => p.infId === inf.id).reduce((s, p) => s + (p.amount || 0), 0);
                const note = notes[inf.id] || "";
                return (
                  <tr key={inf.id} style={{ background: idx % 2 === 0 ? "transparent" : C.bg + "44", transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = C.accent + "08"}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "transparent" : C.bg + "44"}>
                    <td style={{ ...tdStyle, color: C.textMuted, fontSize: 11 }}>{idx + 1}</td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <img src={inf.avatar} style={{ width: 28, height: 28, borderRadius: "50%", background: C.bg }} alt=""
                          onError={e => { e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${inf.handle}&backgroundColor=262626&textColor=ffffff`; }} />
                        <a href={`https://instagram.com/${inf.handle.replace("@","")}`} target="_blank" rel="noopener noreferrer"
                          style={{ fontWeight: 600, color: C.accent, textDecoration: "none" }}
                          onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                          onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}>
                          {inf.handle}
                        </a>
                        {inf.verified && I.verified}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      {editingCell?.id === inf.id && editingCell?.field === "name" ? (
                        <input autoFocus value={inf.name} onChange={e => updateField(inf.id, "name", e.target.value)}
                          onBlur={() => setEditingCell(null)} onKeyDown={e => e.key === "Enter" && setEditingCell(null)}
                          style={{ ...inputBase, padding: "4px 8px", fontSize: 12, width: 120 }} />
                      ) : (
                        <span style={{ cursor: "pointer" }} onClick={() => setEditingCell({ id: inf.id, field: "name" })}>{inf.name || "—"}</span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{inf.followers ? fmt(inf.followers) : "—"}</td>
                    <td style={tdStyle}>
                      {inf.eng > 0 ? (
                        <span style={{ color: getEngRating(inf.followers, inf.eng).color, fontWeight: 600 }}>{inf.eng}%</span>
                      ) : <span style={{ color: C.textMuted }}>—</span>}
                    </td>
                    <td style={tdStyle}>
                      {editingCell?.id === inf.id && editingCell?.field === "niche" ? (
                        <select autoFocus value={inf.niche || ""} onChange={e => updateField(inf.id, "niche", e.target.value)}
                          onBlur={() => setEditingCell(null)}
                          style={{ ...selectBase, padding: "4px 8px", fontSize: 12, width: 130 }}>
                          <option value="—">—</option>
                          {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      ) : (
                        <span style={{ cursor: "pointer" }} onClick={() => setEditingCell({ id: inf.id, field: "niche" })}>{inf.niche || "—"}</span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: "normal", maxWidth: 250, fontSize: 12, lineHeight: 1.4, color: C.textSec }}>
                      {(() => {
                        const np = NICHE_PROBLEM[inf.niche];
                        if (inf.customProblem) return (
                          editingCell?.id === inf.id && editingCell?.field === "customProblem" ? (
                            <input autoFocus value={inf.customProblem}
                              onChange={e => updateField(inf.id, "customProblem", e.target.value)}
                              onBlur={() => setEditingCell(null)} onKeyDown={e => e.key === "Enter" && setEditingCell(null)}
                              style={{ ...inputBase, padding: "4px 8px", fontSize: 11, width: "100%" }} />
                          ) : (
                            <span style={{ cursor: "pointer" }} onClick={() => setEditingCell({ id: inf.id, field: "customProblem" })}>{inf.customProblem}</span>
                          )
                        );
                        if (np) return (
                          editingCell?.id === inf.id && editingCell?.field === "customProblem" ? (
                            <input autoFocus defaultValue={np.problem}
                              onChange={e => updateField(inf.id, "customProblem", e.target.value)}
                              onBlur={() => setEditingCell(null)} onKeyDown={e => e.key === "Enter" && setEditingCell(null)}
                              style={{ ...inputBase, padding: "4px 8px", fontSize: 11, width: "100%" }} />
                          ) : (
                            <span style={{ cursor: "pointer" }} onClick={() => setEditingCell({ id: inf.id, field: "customProblem" })} title="Click to edit">{np.problem}</span>
                          )
                        );
                        return (
                          editingCell?.id === inf.id && editingCell?.field === "customProblem" ? (
                            <input autoFocus value={inf.customProblem || ""}
                              onChange={e => updateField(inf.id, "customProblem", e.target.value)}
                              onBlur={() => setEditingCell(null)} onKeyDown={e => e.key === "Enter" && setEditingCell(null)}
                              style={{ ...inputBase, padding: "4px 8px", fontSize: 11, width: "100%" }} />
                          ) : (
                            <span style={{ cursor: "pointer", color: C.textMuted }} onClick={() => setEditingCell({ id: inf.id, field: "customProblem" })}>Click to add...</span>
                          )
                        );
                      })()}
                    </td>
                    <td style={tdStyle}>
                      {(() => {
                        const np = NICHE_PROBLEM[inf.niche];
                        const prod = inf.bestProduct || (np ? np.product : null);
                        if (!prod) return <span style={{ color: C.textMuted }}>—</span>;
                        const clr = prod === "Jerky" ? "#57997e" : prod === "Chips" ? "#ffbd59" : C.accent;
                        return <span style={{ fontSize: 11, fontWeight: 700, color: clr, background: clr + "18", padding: "3px 8px", borderRadius: 6 }}>{prod}</span>;
                      })()}
                    </td>
                    <td style={tdStyle}>
                      {editingCell?.id === inf.id && editingCell?.field === "location" ? (
                        <select autoFocus value={inf.location || ""} onChange={e => updateField(inf.id, "location", e.target.value)}
                          onBlur={() => setEditingCell(null)}
                          style={{ ...selectBase, padding: "4px 8px", fontSize: 12, width: 120 }}>
                          <option value="—">—</option>
                          {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      ) : (
                        <span style={{ cursor: "pointer" }} onClick={() => setEditingCell({ id: inf.id, field: "location" })}>{inf.location || "—"}</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <select value={inf.stage} onChange={e => updateStage(inf.id, e.target.value)}
                        style={{
                          background: STAGE_CLR[inf.stage] + "22", color: STAGE_CLR[inf.stage],
                          border: `1px solid ${STAGE_CLR[inf.stage]}44`, borderRadius: 6,
                          padding: "4px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer",
                          outline: "none", fontFamily: "inherit"
                        }}>
                        {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td style={tdStyle}>
                      {editingCell?.id === inf.id && editingCell?.field === "costPerDeliv" ? (
                        <input autoFocus type="number" value={inf.costPerDeliv || ""}
                          onChange={e => updateField(inf.id, "costPerDeliv", +e.target.value || 0)}
                          onBlur={() => setEditingCell(null)} onKeyDown={e => e.key === "Enter" && setEditingCell(null)}
                          style={{ ...inputBase, padding: "4px 8px", fontSize: 12, width: 90 }} />
                      ) : (
                        <span style={{ cursor: "pointer", color: inf.costPerDeliv ? C.text : C.textMuted }}
                          onClick={() => setEditingCell({ id: inf.id, field: "costPerDeliv" })}>
                          {inf.costPerDeliv ? inr(inf.costPerDeliv) : "—"}
                        </span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      {editingCell?.id === inf.id && editingCell?.field === "numDelivs" ? (
                        <input autoFocus type="number" value={inf.numDelivs || ""}
                          onChange={e => updateField(inf.id, "numDelivs", +e.target.value || 0)}
                          onBlur={() => setEditingCell(null)} onKeyDown={e => e.key === "Enter" && setEditingCell(null)}
                          style={{ ...inputBase, padding: "4px 8px", fontSize: 12, width: 60 }} min="0" />
                      ) : (
                        <span style={{ cursor: "pointer", color: inf.numDelivs ? C.text : C.textMuted }}
                          onClick={() => setEditingCell({ id: inf.id, field: "numDelivs" })}>
                          {inf.numDelivs || "—"}
                        </span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>
                      {(() => {
                        const total = (+inf.costPerDeliv || 0) * (+inf.numDelivs || 0);
                        return total > 0 ? <span style={{ color: C.yellow }}>{inr(total)}</span> : <span style={{ color: C.textMuted }}>—</span>;
                      })()}
                    </td>
                    <td style={{ ...tdStyle, color: totalPaid > 0 ? C.green : C.textMuted, fontWeight: totalPaid > 0 ? 600 : 400 }}>
                      {totalPaid > 0 ? inr(totalPaid) : "—"}
                    </td>
                    <td style={tdStyle}>
                      {editingCell?.id === inf.id && editingCell?.field === "notes" ? (
                        <input autoFocus value={note}
                          onChange={e => updateNote(inf.id, e.target.value)}
                          onBlur={() => setEditingCell(null)} onKeyDown={e => e.key === "Enter" && setEditingCell(null)}
                          style={{ ...inputBase, padding: "4px 8px", fontSize: 12, width: 180 }} />
                      ) : (
                        <span style={{ cursor: "pointer", color: note ? C.textSec : C.textMuted, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", display: "inline-block" }}
                          onClick={() => setEditingCell({ id: inf.id, field: "notes" })}>
                          {note || "Click to add..."}
                        </span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <select value={inf.assignedTo || ""} onChange={e => updateField(inf.id, "assignedTo", e.target.value)}
                        style={{
                          background: inf.assignedTo ? C.accent + "18" : C.bg,
                          color: inf.assignedTo ? C.accent : C.textMuted,
                          border: `1px solid ${inf.assignedTo ? C.accent + "44" : C.border}`, borderRadius: 6,
                          padding: "4px 8px", fontSize: 11, fontWeight: inf.assignedTo ? 700 : 400, cursor: "pointer",
                          outline: "none", fontFamily: "inherit"
                        }}>
                        <option value="">—</option>
                        {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        <button onClick={() => convertToPaid(inf)} title="Convert & log payment" style={{
                          background: C.green + "22", border: `1px solid ${C.green}44`, color: C.green,
                          borderRadius: 6, padding: "4px 8px", fontSize: 10, fontWeight: 700, cursor: "pointer",
                          opacity: (+inf.costPerDeliv || 0) > 0 ? 1 : 0.3
                        }}>✓ Paid</button>
                        <button onClick={() => remove(inf.id)} style={{
                          background: "none", border: "none", color: C.textMuted, cursor: "pointer", padding: 4,
                          opacity: 0.5, transition: "opacity 0.2s"
                        }} onMouseEnter={e => e.currentTarget.style.opacity = 1}
                          onMouseLeave={e => e.currentTarget.style.opacity = 0.5}>
                          {I.trash}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={17} style={{ padding: "40px 24px", textAlign: "center", color: C.textMuted, fontSize: 13 }}>
                    {entries.length === 0 ? "No influencers yet. Click \"Add Influencer\" or add from Discover tab." : "No influencers match this filter."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// RADAR / SPIDER CHART — Niche Distribution
// ═══════════════════════════════════════════════════════════════════════════
const RADAR_COLORS = ["#0095F6","#8B5CF6","#F59E0B","#10B981","#FF3040","#EC4899","#06B6D4","#F97316","#84CC16","#6366F1","#14B8A6","#E879F9","#FB923C","#22D3EE","#A3E635","#57997e","#ffbd59","#818CF8","#F472B6","#34D399","#FBBF24"];

function RadarChart({ data, title, subtitle }) {
  // data = [{ label, value, color? }] — value is count
  if (!data || data.length === 0) return null;
  // Filter to niches with at least 1 entry, limit to top 12 for readability
  const filtered = data.filter(d => d.value > 0).sort((a, b) => b.value - a.value).slice(0, 12);
  if (filtered.length < 3) {
    // Need at least 3 points for a radar chart; show a simple bar instead
    return (
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 12 }}>{subtitle}</div>}
        {filtered.map((d, i) => (
          <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: C.textSec, width: 100, textAlign: "right" }}>{d.label}</span>
            <div style={{ flex: 1, height: 8, background: C.bg, borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 4, background: RADAR_COLORS[i % RADAR_COLORS.length], width: `${(d.value / Math.max(...filtered.map(x => x.value))) * 100}%` }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.text, width: 24 }}>{d.value}</span>
          </div>
        ))}
      </div>
    );
  }

  const n = filtered.length;
  const maxVal = Math.max(...filtered.map(d => d.value));
  const pad = 60; // padding for labels outside the polygon
  const R = 140;
  const cx = pad + R, cy = pad + R;
  const svgSize = (pad + R) * 2;
  const rings = 4;

  // Compute points on the polygon
  const getPoint = (index, value) => {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    const r = (value / maxVal) * R;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const getLabelPoint = (index) => {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    const r = R + 28;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  // Grid rings
  const gridRings = Array.from({ length: rings }, (_, i) => {
    const r = ((i + 1) / rings) * R;
    const points = Array.from({ length: n }, (_, j) => {
      const angle = (Math.PI * 2 * j) / n - Math.PI / 2;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(" ");
    return points;
  });

  // Data polygon
  const dataPoints = filtered.map((d, i) => {
    const p = getPoint(i, d.value);
    return `${p.x},${p.y}`;
  }).join(" ");

  // Axis lines
  const axes = filtered.map((_, i) => {
    const p = getPoint(i, maxVal);
    return { x2: p.x, y2: p.y };
  });

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8 }}>{subtitle}</div>}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
        <svg viewBox={`0 0 ${svgSize} ${svgSize}`} style={{ width: "100%", maxWidth: 420, flexShrink: 0 }}>
          {/* Grid rings */}
          {gridRings.map((pts, i) => (
            <polygon key={i} points={pts} fill="none" stroke={C.border} strokeWidth={i === rings - 1 ? 1.5 : 0.7} opacity={0.5} />
          ))}
          {/* Axis lines */}
          {axes.map((a, i) => (
            <line key={i} x1={cx} y1={cy} x2={a.x2} y2={a.y2} stroke={C.border} strokeWidth={0.5} opacity={0.4} />
          ))}
          {/* Data fill */}
          <polygon points={dataPoints} fill={C.accent + "25"} stroke={C.accent} strokeWidth={2} />
          {/* Data points */}
          {filtered.map((d, i) => {
            const p = getPoint(i, d.value);
            const clr = RADAR_COLORS[i % RADAR_COLORS.length];
            return <circle key={i} cx={p.x} cy={p.y} r={4} fill={clr} stroke={C.card} strokeWidth={2} />;
          })}
          {/* Labels */}
          {filtered.map((d, i) => {
            const lp = getLabelPoint(i);
            const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
            const anchor = Math.abs(Math.cos(angle)) < 0.1 ? "middle" : Math.cos(angle) > 0 ? "start" : "end";
            return (
              <text key={i} x={lp.x} y={lp.y} textAnchor={anchor} dominantBaseline="middle"
                style={{ fontSize: 10, fill: C.textSec, fontFamily: "inherit", fontWeight: 600 }}>
                {d.label.length > 18 ? d.label.slice(0, 17) + "…" : d.label}
              </text>
            );
          })}
          {/* Ring value labels */}
          {Array.from({ length: rings }, (_, i) => (
            <text key={i} x={cx + 4} y={cy - ((i + 1) / rings) * R + 3}
              style={{ fontSize: 8, fill: C.textMuted, fontFamily: "inherit" }}>
              {Math.round(maxVal * (i + 1) / rings)}
            </text>
          ))}
        </svg>
        {/* Legend */}
        <div style={{ minWidth: 0 }}>
          {filtered.map((d, i) => (
            <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: RADAR_COLORS[i % RADAR_COLORS.length], flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: C.textSec, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.label}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.text, minWidth: 20, textAlign: "right" }}>{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Pill({ label, count, color, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: active ? color+"22" : C.card, border: `1px solid ${active ? color+"55" : C.border}`,
      color: active ? color : C.textSec, borderRadius: 20, padding: "6px 14px",
      fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
      display: "flex", gap: 4, alignItems: "center"
    }}>{label} <span style={{ opacity: 0.7 }}>{count}</span></button>
  );
}

function PipeCard({ inf, onTap, updateStage, remove, notes, updateNote, totalPaid, deliverable, updateDeliverable, discountCode, updateDiscountCode }) {
  const [showNote, setShowNote] = useState(false);
  const [showDelivs, setShowDelivs] = useState(false);
  const ci = STAGES.indexOf(inf.stage);
  const next = ci < STAGES.length-1 ? STAGES[ci+1] : null;

  // Ad rights countdown
  const adRightsDaysLeft = (() => {
    if (!deliverable.adRightsStart) return null;
    const expiry = new Date(deliverable.adRightsStart).getTime() + 30 * 24 * 60 * 60 * 1000;
    const days = Math.ceil((expiry - Date.now()) / (24 * 60 * 60 * 1000));
    return days;
  })();

  const collabStatus = deliverable.collabStatus || "Pending";
  const adStatus = deliverable.adStatus || "Pending";

  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:14, marginBottom:8 }}>
      <div style={{ display:"flex", gap:12, alignItems:"center", cursor:"pointer" }} onClick={onTap}>
        <div style={{ width:44, height:44, borderRadius:"50%", padding:2, background:STAGE_CLR[inf.stage]+"55" }}>
          <img src={inf.avatar} style={{ width:40, height:40, borderRadius:"50%", background:C.bg, display:"block" }} alt=""
            onError={e => { e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${inf.handle}&backgroundColor=262626&textColor=ffffff`; }} />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:600, fontSize:14 }}>{inf.handle}</div>
          <div style={{ fontSize:12, color:C.textSec }}>{fmt(inf.followers)} · {inf.eng}% eng{inf.niche !== "—" ? ` · ${inf.niche}` : ""}</div>
          {/* Deliverable status pills */}
          <div style={{ display:"flex", gap:4, marginTop:5, flexWrap:"wrap" }}>
            <span style={{ fontSize:10, fontWeight:700, color:DELIV_CLR[collabStatus]||C.textMuted, background:(DELIV_CLR[collabStatus]||C.textMuted)+"22", padding:"2px 6px", borderRadius:6 }}>
              🤝 {collabStatus}
            </span>
            <span style={{ fontSize:10, fontWeight:700, color:DELIV_CLR[adStatus]||C.textMuted, background:(DELIV_CLR[adStatus]||C.textMuted)+"22", padding:"2px 6px", borderRadius:6 }}>
              📢 Ad: {adStatus}
            </span>
            {discountCode && (
              <span style={{ fontSize:10, fontWeight:700, color:C.yellow, background:C.yellow+"22", padding:"2px 6px", borderRadius:6 }}>
                🏷 {discountCode}
              </span>
            )}
            {adRightsDaysLeft !== null && adRightsDaysLeft > 0 && (
              <span style={{ fontSize:10, fontWeight:700, color: adRightsDaysLeft <= 5 ? C.red : C.purple, background: (adRightsDaysLeft <= 5 ? C.red : C.purple)+"22", padding:"2px 6px", borderRadius:6 }}>
                ⏱ {adRightsDaysLeft}d left
              </span>
            )}
            {adRightsDaysLeft !== null && adRightsDaysLeft <= 0 && (
              <span style={{ fontSize:10, fontWeight:700, color:C.red, background:C.red+"22", padding:"2px 6px", borderRadius:6 }}>
                ⚠️ Ad rights expired
              </span>
            )}
          </div>
        </div>
        {totalPaid > 0 && <div style={{ fontSize:12, fontWeight:600, color:C.green, flexShrink:0 }}>{inr(totalPaid)}</div>}
      </div>

      <div style={{ display:"flex", gap:6, marginTop:10, flexWrap:"wrap" }}>
        {next && (
          <button onClick={() => updateStage(inf.id, next)} style={{
            background:STAGE_CLR[next]+"22", color:STAGE_CLR[next],
            border:`1px solid ${STAGE_CLR[next]}44`, borderRadius:8,
            padding:"5px 10px", fontSize:11, cursor:"pointer", fontWeight:600,
            display:"flex", alignItems:"center", gap:4
          }}>{I.arrow} {next}</button>
        )}
        <button onClick={() => setShowDelivs(!showDelivs)} style={{
          background: showDelivs ? C.purple+"22" : C.bg, color: showDelivs ? C.purple : C.textSec,
          border:`1px solid ${showDelivs ? C.purple+"44" : C.border}`,
          borderRadius:8, padding:"5px 10px", fontSize:11, cursor:"pointer", fontWeight:500
        }}>📦 Deliverables</button>
        <button onClick={() => setShowNote(!showNote)} style={{
          background:C.bg, color:C.textSec, border:`1px solid ${C.border}`,
          borderRadius:8, padding:"5px 10px", fontSize:11, cursor:"pointer", fontWeight:500
        }}>📝 Note</button>
        <button onClick={() => remove(inf.id)} style={{
          background:C.bg, color:C.red, border:`1px solid ${C.border}`,
          borderRadius:8, padding:"5px 10px", fontSize:11, cursor:"pointer", fontWeight:500,
          display:"flex", alignItems:"center", gap:3, marginLeft:"auto"
        }}>{I.trash} Remove</button>
      </div>

      {/* Deliverables panel */}
      {showDelivs && (
        <div style={{ marginTop:10, background:C.bg, borderRadius:12, padding:12, animation:"fadeIn 0.2s" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
            <div>
              <Label>🤝 Collab Post</Label>
              <select value={collabStatus} onChange={e => updateDeliverable(inf.id, "collabStatus", e.target.value)} style={{ ...selectBase, fontSize:12 }}>
                {DELIV_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <Label>📢 Ad Rights</Label>
              <select value={adStatus} onChange={e => updateDeliverable(inf.id, "adStatus", e.target.value)} style={{ ...selectBase, fontSize:12 }}>
                {DELIV_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom:10 }}>
            <Label>📅 Ad Rights Start Date</Label>
            <input type="date" value={deliverable.adRightsStart || ""} onChange={e => updateDeliverable(inf.id, "adRightsStart", e.target.value)}
              style={{ ...inputBase, fontSize:12, colorScheme:"dark" }} />
          </div>
          <div>
            <Label>🏷 Discount Code</Label>
            <input value={discountCode} onChange={e => updateDiscountCode(inf.id, e.target.value.toUpperCase())}
              placeholder={`e.g. DOKI_${inf.handle.replace("@","").toUpperCase().slice(0,8)}`}
              style={{ ...inputBase, fontSize:12 }} />
          </div>
        </div>
      )}

      {showNote && (
        <textarea value={notes[inf.id]||""} onChange={e => updateNote(inf.id, e.target.value)}
          placeholder="Add notes..." style={{ ...inputBase, marginTop:10, minHeight:60, resize:"vertical" }} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SPEND TAB
// ═══════════════════════════════════════════════════════════════════════════
function SpendTab({ pipeline, payments, addPayment, removePayment, updatePayment, deliverables, notes, addToPipeline, setTab }) {
  const [showBudget, setShowBudget] = useState(true);
  const [editingCell, setEditingCell] = useState(null);

  const totalSpend = payments.reduce((s,p) => s+(p.amount||0), 0);
  const totalRevenue = payments.reduce((s,p) => s+(p.revenue||0), 0);
  const totalEng = payments.reduce((s,p) => s+(p.engagements||0), 0);
  const avgCPE = totalEng > 0 ? totalSpend/totalEng : 0;
  const roi = totalSpend > 0 ? ((totalRevenue-totalSpend)/totalSpend*100) : 0;
  const budgetRemaining = MONTHLY_BUDGET - totalSpend;
  const budgetPct = Math.min(100, (totalSpend / MONTHLY_BUDGET) * 100);

  // Count active ad rights
  const now = Date.now();
  const activeAdRights = Object.values(deliverables).filter(d => {
    if (!d.adRightsStart) return false;
    const expiry = new Date(d.adRightsStart).getTime() + 30 * 24 * 60 * 60 * 1000;
    return expiry > now;
  }).length;

  // Compute actual spend by tier
  const tierSpend = useMemo(() => {
    const ts = { Nano: 0, Micro: 0, Mid: 0, Buffer: 0 };
    payments.forEach(p => {
      const f = p.followers || 0;
      if (f < 10000) ts.Nano += p.amount || 0;
      else if (f < 20000) ts.Micro += p.amount || 0;
      else if (f < 40000) ts.Mid += p.amount || 0;
      else ts.Buffer += p.amount || 0;
    });
    return ts;
  }, [payments]);

  const thStyle = {
    padding: "10px 12px", fontSize: 11, fontWeight: 700, color: C.textMuted,
    textTransform: "uppercase", letterSpacing: 0.5, textAlign: "left",
    borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap",
    position: "sticky", top: 0, background: "#0a0a0a", zIndex: 2
  };
  const tdStyle = {
    padding: "10px 12px", fontSize: 13, borderBottom: `1px solid ${C.border}08`,
    whiteSpace: "nowrap"
  };

  return (
    <div style={{ padding: "20px 24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Spend Tracker</h2>
          <span style={{ fontSize: 13, color: C.textMuted }}>{payments.length} payment{payments.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
        <Stat label="Total Spend" value={inr(totalSpend)} color={C.accent} />
        <Stat label="Revenue" value={inr(totalRevenue)} color={C.green} />
        <Stat label="Engagements" value={totalEng > 0 ? fmt(totalEng) : "—"} color={C.purple} />
        <Stat label="Avg CPE" value={avgCPE > 0 ? inr(Math.round(avgCPE)) : "—"} color={C.yellow} />
        <Stat label="ROI" value={totalSpend > 0 ? roi.toFixed(1)+"%" : "—"} color={roi>=0?C.green:C.red} />
      </div>

      {/* Niche Distribution Radar Chart */}
      {payments.length >= 3 && (() => {
        const nicheCount = {};
        payments.forEach(p => {
          const n = p.niche && p.niche !== "—" ? p.niche : "Uncategorized";
          nicheCount[n] = (nicheCount[n] || 0) + 1;
        });
        const radarData = Object.entries(nicheCount).map(([label, value]) => ({ label, value }));
        return (
          <div style={{ marginBottom: 20 }}>
            <RadarChart data={radarData} title="Paid Niche Distribution" subtitle={`${payments.length} paid influencers across ${radarData.length} niches — check if you're skewed`} />
          </div>
        );
      })()}

      {/* Budget Allocation — Ideal vs Actual */}
      <button onClick={() => setShowBudget(!showBudget)} style={{
        width:"100%", background:C.card, border:`1px solid ${C.border}`, borderRadius:14,
        padding:"12px 16px", marginBottom: showBudget ? 0 : 20, cursor:"pointer",
        display:"flex", alignItems:"center", justifyContent:"space-between", color:C.text
      }}>
        <span style={{ fontWeight:700, fontSize:14 }}>📊 Budget Allocation — Ideal vs Actual</span>
        <span style={{ fontSize:12, color: budgetRemaining >= 0 ? C.green : C.red, fontWeight:700 }}>
          {budgetRemaining >= 0 ? `${inr(budgetRemaining)} left` : `${inr(Math.abs(budgetRemaining))} over`}
          {" "}{showBudget ? "▲" : "▼"}
        </span>
      </button>
      {showBudget && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderTop:"none", borderRadius:"0 0 14px 14px", padding:16, marginBottom:20 }}>
          {/* Overall bar */}
          <div style={{ marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.textMuted, marginBottom:6 }}>
              <span>Total Spent: {inr(totalSpend)} of {inr(MONTHLY_BUDGET)}</span>
              <span style={{ color: budgetPct > 90 ? C.red : budgetPct > 70 ? C.yellow : C.green }}>{budgetPct.toFixed(0)}% used</span>
            </div>
            <div style={{ height:10, background:C.bg, borderRadius:5, overflow:"hidden" }}>
              <div style={{
                height:"100%", borderRadius:5, transition:"width 0.4s",
                width: budgetPct + "%",
                background: budgetPct > 90 ? C.red : budgetPct > 70 ? C.yellow : C.green
              }} />
            </div>
          </div>
          {/* Tier comparison table */}
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 100px 100px 80px", gap: "6px 12px", fontSize: 12, alignItems: "center" }}>
            <div style={{ fontWeight: 700, color: C.textMuted, fontSize: 10, textTransform: "uppercase" }}>Tier</div>
            <div style={{ fontWeight: 700, color: C.textMuted, fontSize: 10, textTransform: "uppercase" }}>Progress</div>
            <div style={{ fontWeight: 700, color: C.textMuted, fontSize: 10, textTransform: "uppercase", textAlign: "right" }}>Ideal</div>
            <div style={{ fontWeight: 700, color: C.textMuted, fontSize: 10, textTransform: "uppercase", textAlign: "right" }}>Actual</div>
            <div style={{ fontWeight: 700, color: C.textMuted, fontSize: 10, textTransform: "uppercase", textAlign: "right" }}>Diff</div>
            {BUDGET_TIERS.map(tier => {
              const ideal = Math.round(MONTHLY_BUDGET * tier.pct / 100);
              const actual = tierSpend[tier.label] || 0;
              const diff = actual - ideal;
              const pct = ideal > 0 ? Math.min(100, (actual / ideal) * 100) : 0;
              return [
                <div key={tier.label+"name"} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: tier.color, flexShrink: 0 }} />
                  <span style={{ fontWeight: 600, color: C.text }}>{tier.label}</span>
                  <span style={{ color: C.textMuted, fontSize: 10 }}>{tier.range}</span>
                </div>,
                <div key={tier.label+"bar"} style={{ height: 6, background: C.bg, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 3, width: pct + "%", background: pct > 100 ? C.red : tier.color, transition: "width 0.4s" }} />
                </div>,
                <div key={tier.label+"ideal"} style={{ textAlign: "right", color: C.textSec }}>{inr(ideal)}</div>,
                <div key={tier.label+"actual"} style={{ textAlign: "right", fontWeight: 600, color: actual > 0 ? C.text : C.textMuted }}>{actual > 0 ? inr(actual) : "—"}</div>,
                <div key={tier.label+"diff"} style={{ textAlign: "right", fontWeight: 600, color: diff > 0 ? C.red : diff < 0 ? C.green : C.textMuted, fontSize: 11 }}>
                  {actual > 0 ? (diff > 0 ? "+" : "") + inr(diff) : "—"}
                </div>
              ];
            })}
          </div>
          {activeAdRights > 0 && (
            <div style={{ marginTop:14, background:C.purple+"15", border:`1px solid ${C.purple}33`, borderRadius:10, padding:"8px 12px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{ fontSize:12, color:C.textSec }}>Active Ad Rights</span>
              <span style={{ fontSize:13, fontWeight:700, color:C.purple }}>{activeAdRights} creator{activeAdRights > 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      )}

      {/* ─── Payments Spreadsheet ─── */}
      {payments.length > 0 ? (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1100 }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: 40 }}>#</th>
                  <th style={thStyle}>Influencer</th>
                  <th style={thStyle}>Niche</th>
                  <th style={thStyle}>Followers</th>
                  <th style={thStyle}>Content</th>
                  <th style={thStyle}>Cost/Deliv</th>
                  <th style={thStyle}># Delivs</th>
                  <th style={thStyle}>Total Paid</th>
                  <th style={thStyle}>Engagements</th>
                  <th style={thStyle}>CPE</th>
                  <th style={thStyle}>Revenue (Sales)</th>
                  <th style={thStyle}>ROI</th>
                  <th style={thStyle}>Note</th>
                  <th style={{ ...thStyle, width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p, idx) => {
                  const cpe = (p.engagements || 0) > 0 ? (p.amount || 0) / p.engagements : 0;
                  const pRoi = (p.amount || 0) > 0 ? ((p.revenue || 0) - (p.amount || 0)) / (p.amount || 0) * 100 : 0;
                  return (
                    <tr key={p.id} style={{ background: idx % 2 === 0 ? "transparent" : C.bg + "44" }}
                      onMouseEnter={e => e.currentTarget.style.background = C.accent + "08"}
                      onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "transparent" : C.bg + "44"}>
                      <td style={{ ...tdStyle, color: C.textMuted, fontSize: 11 }}>{idx + 1}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{p.infName}</td>
                      <td style={{ ...tdStyle, color: C.textSec }}>{p.niche || "—"}</td>
                      <td style={{ ...tdStyle }}>{p.followers ? fmt(p.followers) : "—"}</td>
                      <td style={tdStyle}>
                        {editingCell?.id === p.id && editingCell?.field === "contentType" ? (
                          <select autoFocus value={p.contentType || "Reel"} onChange={e => { updatePayment(p.id, { contentType: e.target.value }); setEditingCell(null); }}
                            onBlur={() => setEditingCell(null)} style={{ ...selectBase, padding: "4px 8px", fontSize: 12, width: 90 }}>
                            {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        ) : (
                          <span style={{ cursor: "pointer" }} onClick={() => setEditingCell({ id: p.id, field: "contentType" })}>
                            {p.contentType === "Reel" ? "🎬" : p.contentType === "Story" ? "📱" : p.contentType === "Post" ? "📸" : "📄"} {p.contentType}
                          </span>
                        )}
                      </td>
                      <td style={tdStyle}>{p.costPerDeliv ? inr(p.costPerDeliv) : inr(p.amount)}</td>
                      <td style={tdStyle}>{p.numDelivs || 1}</td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: C.accent }}>{inr(p.amount)}</td>
                      <td style={tdStyle}>
                        {editingCell?.id === p.id && editingCell?.field === "engagements" ? (
                          <input autoFocus type="number" value={p.engagements || ""}
                            onChange={e => updatePayment(p.id, { engagements: +e.target.value || 0 })}
                            onBlur={() => setEditingCell(null)} onKeyDown={e => e.key === "Enter" && setEditingCell(null)}
                            style={{ ...inputBase, padding: "4px 8px", fontSize: 12, width: 90 }} />
                        ) : (
                          <span style={{ cursor: "pointer", color: p.engagements ? C.text : C.textMuted }}
                            onClick={() => setEditingCell({ id: p.id, field: "engagements" })}>
                            {p.engagements ? fmt(p.engagements) : "Click to add"}
                          </span>
                        )}
                      </td>
                      <td style={{ ...tdStyle, color: cpe > 0 ? C.yellow : C.textMuted, fontWeight: cpe > 0 ? 600 : 400 }}>
                        {cpe > 0 ? inr(Math.round(cpe)) : "—"}
                      </td>
                      <td style={tdStyle}>
                        {editingCell?.id === p.id && editingCell?.field === "revenue" ? (
                          <input autoFocus type="number" value={p.revenue || ""}
                            onChange={e => updatePayment(p.id, { revenue: +e.target.value || 0 })}
                            onBlur={() => setEditingCell(null)} onKeyDown={e => e.key === "Enter" && setEditingCell(null)}
                            style={{ ...inputBase, padding: "4px 8px", fontSize: 12, width: 100 }} />
                        ) : (
                          <span style={{ cursor: "pointer", color: p.revenue ? C.green : C.textMuted }}
                            onClick={() => setEditingCell({ id: p.id, field: "revenue" })}>
                            {p.revenue ? inr(p.revenue) : "Click to add"}
                          </span>
                        )}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: (p.amount || 0) > 0 && (p.revenue || 0) > 0 ? (pRoi >= 0 ? C.green : C.red) : C.textMuted }}>
                        {(p.amount || 0) > 0 && (p.revenue || 0) > 0 ? pRoi.toFixed(0) + "%" : "—"}
                      </td>
                      <td style={{ ...tdStyle, color: C.textSec, maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {editingCell?.id === p.id && editingCell?.field === "note" ? (
                          <input autoFocus value={p.note || ""}
                            onChange={e => updatePayment(p.id, { note: e.target.value })}
                            onBlur={() => setEditingCell(null)} onKeyDown={e => e.key === "Enter" && setEditingCell(null)}
                            style={{ ...inputBase, padding: "4px 8px", fontSize: 12, width: 150 }} />
                        ) : (
                          <span style={{ cursor: "pointer", color: p.note ? C.textSec : C.textMuted }}
                            onClick={() => setEditingCell({ id: p.id, field: "note" })}>
                            {p.note || "—"}
                          </span>
                        )}
                      </td>
                      <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                          <button title="Move back to Pipeline" onClick={() => {
                            addToPipeline({
                              id: p.infId || "restore_" + Date.now(),
                              handle: p.infName, name: (p.infName || "").replace("@", ""),
                              followers: p.followers || 0, eng: 0, avgLikes: 0, avgComments: 0,
                              niche: p.niche || "—", location: "—",
                              posts: 0, following: 0, similarity: 0, verified: false, growth: 0,
                              avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.infName || "")}&backgroundColor=262626&textColor=ffffff&fontSize=36`,
                              costPerDeliv: p.costPerDeliv || p.amount || 0,
                              numDelivs: p.numDelivs || 1,
                            });
                            removePayment(p.id);
                            setTab("pipeline");
                          }} style={{
                            background: C.yellow + "22", border: `1px solid ${C.yellow}44`, color: C.yellow,
                            borderRadius: 6, padding: "4px 8px", fontSize: 10, fontWeight: 700, cursor: "pointer"
                          }}>↩ Undo</button>
                          <button onClick={() => removePayment(p.id)} style={{
                            background: "none", border: "none", color: C.textMuted, cursor: "pointer", padding: 4,
                            opacity: 0.5, transition: "opacity 0.2s"
                          }} onMouseEnter={e => e.currentTarget.style.opacity = 1}
                            onMouseLeave={e => e.currentTarget.style.opacity = 0.5}>
                            {I.trash}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {/* Totals row */}
                <tr style={{ background: C.bg + "88", borderTop: `2px solid ${C.border}` }}>
                  <td style={{ ...tdStyle, fontWeight: 700, fontSize: 11, color: C.textMuted }} colSpan={7}>TOTALS</td>
                  <td style={{ ...tdStyle, fontWeight: 800, color: C.accent }}>{inr(totalSpend)}</td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: C.text }}>{totalEng > 0 ? fmt(totalEng) : "—"}</td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: C.yellow }}>{avgCPE > 0 ? inr(Math.round(avgCPE)) : "—"}</td>
                  <td style={{ ...tdStyle, fontWeight: 800, color: C.green }}>{inr(totalRevenue)}</td>
                  <td style={{ ...tdStyle, fontWeight: 800, color: roi >= 0 ? C.green : C.red }}>{totalSpend > 0 ? roi.toFixed(1) + "%" : "—"}</td>
                  <td style={tdStyle} colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ textAlign:"center", padding:"40px 24px", color:C.textMuted }}>
          <div style={{ fontSize:40, marginBottom:12 }}>💰</div>
          <div style={{ fontWeight:600, color:C.textSec, marginBottom:6, fontSize:16 }}>No Payments Yet</div>
          <div style={{ fontSize:13 }}>Convert prospects from the Pipeline tab by clicking "✓ Paid"</div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:14, textAlign:"center" }}>
      <div style={{ fontSize:11, color:C.textMuted, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5, marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:20, fontWeight:800, color }}>{value}</div>
    </div>
  );
}
function Mini({ label, value, color }) {
  return (
    <div style={{ textAlign:"center" }}>
      <div style={{ fontSize:10, color:C.textMuted, fontWeight:600, textTransform:"uppercase" }}>{label}</div>
      <div style={{ fontSize:14, fontWeight:700, color:color||C.text, marginTop:2 }}>{value}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DETAIL MODAL
// ═══════════════════════════════════════════════════════════════════════════
function DetailModal({ inf, show, onClose, pipeline, addToPipeline, updateStage, notes, updateNote, payments, deliverables, updateDeliverable, discountCodes, updateDiscountCode }) {
  const inP = !!pipeline[inf.id];
  const pInf = pipeline[inf.id];
  const iPay = payments.filter(p => p.infId === inf.id);
  const totalPaid = iPay.reduce((s,p) => s+(p.amount||0), 0);
  const [briefCopied, setBriefCopied] = useState(false);

  const copyBrief = () => {
    const code = discountCodes[inf.id] || `DOKI_${inf.handle.replace("@","").toUpperCase().slice(0,8)}`;
    const brief = `Hi ${inf.handle}! 👋

We're DOKi — India's first high-protein chicken chips brand. We love your content and think you'd be a great fit for a collaboration.

Here's what we're looking for:
📹 1 x Reel (Collab post — both our accounts tagged)
📢 Ad Rights for 30 days (we may boost the content as a paid ad)

Your unique discount code for your audience: ${code}

Content should feel natural — show DOKi as your go-to smart snack. No heavy scripting, just authentic vibes.

Interested? Let's chat on WhatsApp: 9711888905
— Team DOKi 🍗`;
    navigator.clipboard.writeText(brief).then(() => {
      setBriefCopied(true);
      setTimeout(() => setBriefCopied(false), 2000);
    });
  };

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.85)",
      backdropFilter:"blur(8px)", display:"flex", flexDirection:"column", justifyContent:"flex-end",
      opacity:show?1:0, pointerEvents:show?"auto":"none", transition:"opacity 0.3s"
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background:C.card, borderRadius:"20px 20px 0 0", maxHeight:"85vh",
        overflowY:"auto", padding:"20px 16px 32px",
        transform:show?"translateY(0)":"translateY(100%)",
        transition:"transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)"
      }}>
        <div style={{ width:36, height:4, borderRadius:2, background:C.borderLight, margin:"0 auto 16px" }} />

        <div style={{ display:"flex", gap:16, alignItems:"center", marginBottom:20 }}>
          <div style={{ width:72, height:72, borderRadius:"50%", padding:3, background:C.gradient, flexShrink:0 }}>
            <img src={inf.avatar} style={{ width:66, height:66, borderRadius:"50%", background:C.bg, display:"block" }} alt=""
              onError={e => { e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${inf.handle}&backgroundColor=262626&textColor=ffffff`; }} />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
              <span style={{ fontWeight:700, fontSize:18 }}>{inf.handle}</span>
              {inf.verified && I.verified}
              {inf.isReal && <span style={{ fontSize:9, fontWeight:700, color:C.green, background:C.green+"22", padding:"2px 6px", borderRadius:6 }}>LIVE DATA</span>}
            </div>
            <div style={{ fontSize:13, color:C.textSec }}>{inf.name}</div>
            <div style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>
              {inf.niche !== "—" ? inf.niche : ""}{inf.niche !== "—" && inf.location !== "—" ? " · " : ""}{inf.location !== "—" ? inf.location : ""}
            </div>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:4, marginBottom:16, background:C.bg, borderRadius:14, padding:14 }}>
          {[["Posts",fmt(inf.posts)],["Followers",fmt(inf.followers)],["Following",fmt(inf.following)],["Eng Rate",inf.eng+"%"]].map(([l,v]) => (
            <div key={l} style={{ textAlign:"center" }}>
              <div style={{ fontWeight:800, fontSize:16 }}>{v}</div>
              <div style={{ fontSize:10, color:C.textMuted, marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:16 }}>
          <div style={{ background:C.bg, borderRadius:12, padding:12, textAlign:"center" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:4, marginBottom:4 }}>{I.heart}<span style={{ fontWeight:700, fontSize:15 }}>{fmt(inf.avgLikes)}</span></div>
            <div style={{ fontSize:10, color:C.textMuted }}>Avg Likes</div>
          </div>
          <div style={{ background:C.bg, borderRadius:12, padding:12, textAlign:"center" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:4, marginBottom:4 }}>{I.comment}<span style={{ fontWeight:700, fontSize:15 }}>{fmt(inf.avgComments)}</span></div>
            <div style={{ fontSize:10, color:C.textMuted }}>Avg Comments</div>
          </div>
          <div style={{ background:C.bg, borderRadius:12, padding:12, textAlign:"center" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:4, marginBottom:4 }}>
              {inf.growth>=0?I.up:I.down}<span style={{ fontWeight:700, fontSize:15, color:inf.growth>=0?C.green:C.red }}>{Math.abs(inf.growth)}%</span>
            </div>
            <div style={{ fontSize:10, color:C.textMuted }}>Growth/mo</div>
          </div>
        </div>

        {/* Engagement Benchmark */}
        {(() => {
          const rating = getEngRating(inf.followers, inf.eng);
          const bench = getEngBenchmark(inf.followers);
          const tierLabel = inf.followers < 5000 ? "1K–5K" : inf.followers < 10000 ? "5K–10K" : inf.followers < 50000 ? "10K–50K" : inf.followers < 100000 ? "50K–100K" : inf.followers < 500000 ? "100K–500K" : inf.followers < 1000000 ? "500K–1M" : "1M+";
          const maxVal = bench.great * 1.5;
          const barPct = Math.min(100, (inf.eng / maxVal) * 100);
          return (
            <div style={{ background:C.bg, borderRadius:14, padding:14, marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.textSec }}>Engagement Rating</div>
                <span style={{ fontSize:12, fontWeight:700, color:rating.color, background:rating.color+"22", padding:"3px 8px", borderRadius:8 }}>
                  {rating.emoji} {rating.label} for {tierLabel} tier
                </span>
              </div>
              <div style={{ position:"relative", height:8, background:C.border, borderRadius:4, marginBottom:10, overflow:"hidden" }}>
                <div style={{
                  position:"absolute", left:0, top:0, height:"100%", borderRadius:4,
                  width:barPct+"%", background:`linear-gradient(90deg, ${C.yellow}, ${C.green}, ${C.purple})`,
                  transition:"width 0.5s ease"
                }} />
                {/* Benchmark markers */}
                <div style={{ position:"absolute", left:(bench.avg[0]/maxVal*100)+"%", top:-2, width:1, height:12, background:C.yellow+"88" }} />
                <div style={{ position:"absolute", left:(bench.good[0]/maxVal*100)+"%", top:-2, width:1, height:12, background:C.green+"88" }} />
                <div style={{ position:"absolute", left:(bench.great/maxVal*100)+"%", top:-2, width:1, height:12, background:C.purple+"88" }} />
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:C.textMuted }}>
                <span style={{ color:C.yellow }}>Avg {bench.avg[0]}–{bench.avg[1]}%</span>
                <span style={{ color:C.green }}>Good {bench.good[0]}–{bench.good[1]}%</span>
                <span style={{ color:C.purple }}>Great {bench.great}%+</span>
              </div>
            </div>
          );
        })()}

        {inf.bio && (
          <div style={{ background:C.bg, borderRadius:12, padding:12, marginBottom:16, fontSize:13, color:C.textSec, lineHeight:1.5 }}>
            {inf.bio}
          </div>
        )}

        {inf.similarity > 0 && (
          <div style={{
            background:`linear-gradient(135deg, ${C.accent}15, ${C.purple}15)`,
            border:`1px solid ${C.accent}33`, borderRadius:14, padding:14, marginBottom:16,
            display:"flex", alignItems:"center", justifyContent:"space-between"
          }}>
            <div>
              <div style={{ fontSize:12, color:C.textSec, fontWeight:600 }}>Similarity Match</div>
              <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>Based on niche, audience & content style</div>
            </div>
            <div style={{ fontSize:28, fontWeight:800, color:C.accent }}>{inf.similarity}%</div>
          </div>
        )}

        {inP ? (
          <div style={{ marginBottom:16 }}>
            <Label>Pipeline Stage</Label>
            <div style={{ display:"flex", gap:6 }}>
              {STAGES.map(stage => (
                <button key={stage} onClick={() => updateStage(inf.id, stage)} style={{
                  flex:1, background:pInf.stage===stage?STAGE_CLR[stage]+"33":C.bg,
                  color:pInf.stage===stage?STAGE_CLR[stage]:C.textMuted,
                  border:`1px solid ${pInf.stage===stage?STAGE_CLR[stage]+"66":C.border}`,
                  borderRadius:10, padding:"8px 4px", fontSize:11, fontWeight:600, cursor:"pointer"
                }}>{stage}</button>
              ))}
            </div>
            {totalPaid > 0 && <div style={{ marginTop:10, fontSize:13, color:C.green, fontWeight:600 }}>💰 Total paid: {inr(totalPaid)}</div>}
          </div>
        ) : (
          <button onClick={() => addToPipeline(inf)} style={{
            width:"100%", background:C.accent, color:"#fff", border:"none", borderRadius:12,
            padding:14, fontWeight:700, fontSize:15, cursor:"pointer", marginBottom:16,
            display:"flex", alignItems:"center", justifyContent:"center", gap:8
          }}>{I.plus} Add to Pipeline</button>
        )}

        {inP && (
          <>
            {/* Creator Brief */}
            <button onClick={copyBrief} style={{
              width:"100%", background: briefCopied ? C.green+"22" : C.card,
              color: briefCopied ? C.green : C.textSec,
              border:`1px solid ${briefCopied ? C.green+"44" : C.border}`,
              borderRadius:12, padding:12, fontWeight:600, fontSize:13,
              cursor:"pointer", marginBottom:12, transition:"all 0.2s"
            }}>
              {briefCopied ? "✅ Brief copied to clipboard!" : "📋 Copy Creator Brief"}
            </button>

            <div>
              <Label>Notes</Label>
              <textarea value={notes[inf.id]||""} onChange={e => updateNote(inf.id, e.target.value)}
                placeholder="Pricing, content ideas, contact info..."
                style={{ ...inputBase, minHeight:70, resize:"vertical" }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Shared Components ──────────────────────────────────────────────────────
function Label({ children, style: s }) {
  return <div style={{ fontSize:12, fontWeight:700, color:C.textSec, textTransform:"uppercase", letterSpacing:1, marginBottom:8, ...s }}>{children}</div>;
}
function Sel({ label, value, onChange, options }) {
  return <div><Label>{label}</Label><select value={value} onChange={e => onChange(e.target.value)} style={selectBase}>
    <option value="">All</option>{options.map(o => <option key={o} value={o}>{o}</option>)}</select></div>;
}
function Inp({ label, value, onChange, ph }) {
  return <div><Label>{label}</Label><input type="number" value={value} onChange={e => onChange(e.target.value)} placeholder={ph} style={inputBase} /></div>;
}
