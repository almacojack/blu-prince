# tng.li Business Plan
## "Tingly URLs" - Universal Short Links for IoT & E-Commerce

---

## Executive Summary

**tng.li** (pronounced "tingly") is a universal short URL namespace designed for the Internet of Things (IoT), physical products, and e-commerce applications. Every "Thing" in the TingOs ecosystem gets a unique tng.li URL, making it instantly scannable, shareable, and accessible from any device.

---

## The Problem

1. **UUIDs are unreadable** - `550e8400-e29b-41d4-a716-446655440000` means nothing to humans
2. **QR codes need destinations** - Physical products need persistent, memorable URLs
3. **IoT devices need identity** - Every connected device needs a web-addressable endpoint
4. **E-commerce fragmentation** - Product links break when platforms change
5. **No unified "Thing" namespace** - Objects in the physical world lack digital identity

---

## The Solution: tng.li

Every Thing in TingOs gets a unique short URL:

```
https://tng.li/abc123
https://tng.li/my-art-piece
https://tng.li/vintage-lamp-42
```

### Key Features

| Feature | Description |
|---------|-------------|
| **Instant QR Codes** | Every tng.li URL auto-generates a styled QR code |
| **Human-Memorable** | Custom slugs available (e.g., `tng.li/my-product`) |
| **Device Agnostic** | Works on phones, IoT sensors, AR glasses, anything |
| **State-Enabled** | URLs point to TOSS cartridges with interactive state |
| **Analytics Built-In** | Scan counts, geo-data, device types |
| **Permanent Links** | URLs never expire, redirect to current state |

---

## Market Opportunities

### 1. Auction Platforms (unwanted.ad, artsy.sale)

**Use Case:** Every auction listing gets a tng.li URL printed on physical item tags

- **unwanted.ad** - "Misfit toy" auctions with scannable provenance
- **artsy.sale** - Art dealer auctions with certificate of authenticity QR codes

**Revenue Model:**
- Free tier: 10 tng.li URLs per seller
- Pro tier ($9.99/mo): Unlimited URLs + analytics
- Enterprise: White-label tng.li domains

### 2. IoT & Smart Products

**Use Case:** Manufacturers embed tng.li URLs in physical products

- Smart home devices linking to setup wizards
- Industrial sensors linking to maintenance cartridges
- Consumer electronics with digital manuals as TOSS files

**Revenue Model:**
- API access: $0.001 per resolution (high volume)
- SDK licensing for embedded devices
- Enterprise contracts for bulk URL allocation

### 3. Scheduling & Time-Based Services (l8r.co)

**Use Case:** Time-sensitive content with expiring states

- Event tickets that auto-expire
- Appointment confirmations
- Time capsules (reveal after date X)

**Revenue Model:**
- Subscription for scheduled URL state changes
- Premium "sealed until" dates
- API for calendar integrations

### 4. Crypto & Trading (coins.rip)

**Use Case:** Shareable trading playbooks and portfolio snapshots

- Share a swing trade strategy as a cartridge
- QR codes in trading community posts
- Verifiable timestamped market predictions

**Revenue Model:**
- Premium analytics on link engagement
- Integration fees with trading platforms

---

## Technical Architecture

```
User scans QR → tng.li/abc123 → TingOs Platform → TOSS Cartridge
                     ↓
              Analytics captured
              Device detected
              State resolved
                     ↓
              Render experience
              (Web, Mobile, IoT, AR)
```

### API Endpoints

```
GET  tng.li/:id           → Resolve to cartridge
POST tng.li/create        → Mint new tng.li URL
GET  tng.li/:id/qr        → Get QR code image
GET  tng.li/:id/stats     → Analytics data
```

---

## Competitive Advantages

| vs. bit.ly | vs. QR generators | vs. NFT marketplaces |
|-----------|-------------------|---------------------|
| State-aware links | Interactive experiences | Lower friction (no crypto) |
| Built-in analytics | Persistent identity | Immediate utility |
| IoT-first design | Branded experiences | Physical-digital bridge |
| TOSS cartridge integration | Offline-capable | Platform agnostic |

---

## Go-To-Market Strategy

### Phase 1: Internal Adoption (Now)
- Every cartridge in TingOs gets a tng.li URL
- QR buttons appear in all UIs
- Build muscle memory in existing users

### Phase 2: Satellite Domains (Q1 2026)
- unwanted.ad launches with tng.li integration
- artsy.sale auction certificates
- l8r.co scheduling links

### Phase 3: External Partnerships (Q2 2026)
- IoT manufacturer partnerships
- E-commerce platform integrations
- Retail point-of-sale systems

### Phase 4: Developer Platform (Q3 2026)
- Public API release
- SDKs for Python, Node, Arduino, MicroPython
- Developer documentation and tutorials

---

## Revenue Projections

| Year | Free URLs | Paid URLs | API Calls | Revenue |
|------|-----------|-----------|-----------|---------|
| 2026 | 100K | 5K | 1M | $150K |
| 2027 | 500K | 25K | 10M | $750K |
| 2028 | 2M | 100K | 100M | $3M |

---

## Investment Uses

1. **Infrastructure** - CDN, edge computing for low-latency QR resolution
2. **Mobile App** - Native tng.li scanner with AR capabilities
3. **Hardware Partnerships** - Pre-printed QR sticker partnerships
4. **Developer Relations** - Documentation, SDKs, community building

---

## Summary

tng.li bridges the physical and digital worlds. Every object, device, artwork, appointment, and Thing gets a permanent, scannable, interactive identity. The "tingly" feeling of scanning something and having it come alive is the future of human-object interaction.

**The tng.li URL is not just a link - it's a cartridge loader for reality.**

---

*Document Version: 1.0*  
*Last Updated: January 2026*
