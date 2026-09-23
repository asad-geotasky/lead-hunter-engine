# LeadHunter Engine (v2.0 PRO)

An end-to-end local business lead generation, deep-enrichment, instant landing page mockup, and CRM pipeline engine.

Built for agencies, freelancers, and growth consultants selling web design, SEO, and marketing services to local businesses.

---

## Key Features

1. **Intelligent Sourcing & Discovery:**
   - **Google Places API (New):** Built with optimized `FieldMask` queries to retrieve business profiles, phones, websites, ratings, and customer reviews in a single call (avoiding duplicate Places Details billing).
   - **Smart Offline/Sandbox Mode:** Automatically generates realistic local prospects for any niche and city without requiring an API key.

2. **Intent Signal Scoring (0–100):**
   - Automatically prioritizes leads based on:
     - **No Website (+35 pts):** Prime targets for new website builds.
     - **Website Health (+15–30 pts):** Insecure HTTP (no SSL), broken mobile responsiveness, outdated copyright year.
     - **Review Sweet Spot (+20 pts):** High ratings (≥ 4.0★) with low review count (< 20 reviews)—high-potential businesses needing digital expansion.
     - **Verified Mobile (+15 pts):** Enables direct SMS and personal owner outreach.
     - **Identified Owner (+15 pts):** Bypasses gatekeepers directly to decision-makers.

3. **Deep Enrichment Pipeline:**
   - **Phone Line-Type Intelligence:** Classifies numbers into `MOBILE`, `LANDLINE`, or `VOIP` (Twilio Lookup API supported with heuristic fallback).
   - **Owner & Registry Discovery:** Mines public business registries and corporate filings (OpenCorporates) to surface owner/managing member names.
   - **Website Technical Audit:** Inspects SSL certificates, mobile viewport tags, and CMS technology (WordPress, Wix, Squarespace).

4. **Instant Interactive Mockup Generator:**
   - Automatically creates a live preview landing page for no-website leads at `/preview/[leadId]`.
   - Injects real business name, phone number, city, services, and 5-star customer review quotes.
   - Features an Agency Claim Banner allowing prospects to see their actual business live.

5. **AI Outreach Kit & Script Engine:**
   - **Cold Email Pitch:** Follows the proven *Question → Site Preview Link → Low-Risk Offer* formula.
   - **Direct SMS / WhatsApp Opener:** Tailored for verified mobile numbers.
   - **Phone Script:** Includes Receptionist/Gatekeeper hook, Owner pitch, and common objection handling.

6. **CRM Pipeline & Export:**
   - Visual Kanban board with stage progression (`Discovered` → `Enriched` → `Demo Ready` → `Contacted` → `Interested` → `Won`).
   - Per-lead activity timeline and call notes.
   - 1-Click CSV and JSON export for Lemlist, Instantly, Smartlead, or Excel.

---

## Getting Started

### 1. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Configuration & API Keys (Optional)
Create a `.env.local` file to connect live external APIs:
```env
# Optional: Google Places API Key
GOOGLE_PLACES_API_KEY=your_key_here

# Optional: Twilio Line-Type Intelligence
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token

# Optional: OpenCorporates API
OPENCORPORATES_API_KEY=your_key
```
*(If no API keys are supplied, the engine runs in Sandbox Mode with full functionality).*
