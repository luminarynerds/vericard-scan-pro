# VERICARD DEVELOPMENT RULES
**Version 2.0 - Reviewed by Linus Torvalds**

## 🐧 LINUS'S REVIEW
*"Your rules are 90% bureaucratic nonsense. Here's what actually matters:"*

## 🚫 REAL PROHIBITIONS
1. **No code without working tests** - If it's not tested, it's broken
2. **No architecture astronauts** - Build something that works FIRST
3. **No blockchain bullshit** - Until you have actual users who need it
4. **No "enterprise patterns"** - Until you have enterprise problems

## ✅ ACTUAL DEVELOPMENT PRACTICES

### 1. CODE FIRST, PLAN LATER
```bash
# WRONG: 20 planning documents, 0 working features
# RIGHT: 1 working feature, document what you built
```

### 2. REAL COST TRACKING
```typescript
// GOOD: Actual measurement
// COST: $0.0001/scan (measured over 1000 real scans)
function processCard() { 
  const start = performance.now();
  // ... actual implementation
  const cost = calculateActualCost(performance.now() - start);
}

// BAD: Made-up numbers
// COST: $0.0001/scan (TensorFlow.js)  // <- How do you know?
```

### 3. SIMPLICITY RULES
- Start with a monolith, not microservices
- Use boring technology that works
- One database, one deployment, one repo (you got this right)

## 🛠️ TECHNICAL REQUIREMENTS

### MUST HAVE (Day 1)
1. **Working camera capture** - react-webcam ✓
2. **Basic image processing** - TensorFlow.js ✓
3. **Local storage** - IndexedDB (when you actually need it)
4. **Tests that run** - Jest with >0% coverage to start

### NICE TO HAVE (When You Have Users)
1. Cloud processing fallback
2. Advanced AI models
3. Payment processing
4. Fancy monitoring

### STOP TALKING ABOUT (Until Year 2)
1. Blockchain anything
2. "Theft prevention protocols"
3. Docker Swarm (just use a VPS)
4. Grafana dashboards for your 0 users

## 💰 REALISTIC ECONOMICS
| What | Real Cost | Your Fantasy |
|------|-----------|--------------|
| Hosting | $5-20/mo VPS | "Docker Swarm on DigitalOcean" |
| Per-scan | Measure it! | "$0.001" |
| Development time | 100x your estimate | "24-hour patch window" |

## 🔧 ACTUAL TOOLING
```yaml
Required:
  - Git (obviously)
  - Node.js + pnpm ✓
  - Jest for tests ✓
  - One deployment method

Optional:
  - Docker (when needed)
  - CI/CD (when you have something to deploy)
  - Monitoring (when you have something to monitor)

Banned Until Proven Necessary:
  - Kubernetes
  - Microservices  
  - GraphQL
  - Any "Enterprise Architecture"
```

## 📋 SIMPLIFIED MODULE REQUIREMENTS

### CAMERA SYSTEM
```typescript
// Version 1: Make it work
async function captureCard() {
  const image = await webcam.capture();
  return image;
}

// Version 2: Make it good (after v1 ships)
// Version 3: Make it fast (after users complain)
```

### AI PROCESSING
```typescript
// Start simple, measure everything
async function analyzeCard(image: ImageData) {
  const start = performance.now();
  const result = await model.detect(image);
  
  console.log(`Processing took ${performance.now() - start}ms`);
  return result;
}
```

## ⚠️ FAILURE PROTOCOLS (SIMPLIFIED)
1. **It's broken** → Fix it
2. **It's slow** → Profile it first
3. **It's insecure** → Actually understand the threat model

## 🚀 REAL USAGE INSTRUCTIONS
```bash
# 1. Write code
npm test

# 2. Make sure it works
npm run dev

# 3. Ship it
git push

# That's it. Stop overengineering.
```

## 🔐 SECURITY THAT MATTERS
1. **HTTPS** - Yes, always
2. **Input validation** - Obviously
3. **Rate limiting** - When you have traffic
4. **Encryption** - When you store sensitive data

Skip the "blockchain audit trails" until someone pays for them.

---

## LINUS'S FINAL VERDICT

*"These original rules read like someone who's never shipped production code. 'Advisory panels'? 'Enforcement mechanisms'? 'Automatic validation snippets'? Just write good code, test it, and ship it.*

*The only validation you need is: Does it work? Is it fast enough? Can you maintain it?*

*Stop writing rules and start writing code."*

### The Only Rules That Matter:
1. **Make it work**
2. **Make it correct** 
3. **Make it fast** (in that order)
4. **Don't be clever** - clever code is unmaintainable
5. **Measure everything** - opinions < data

---

*P.S. That quote attributed to me at the bottom? I never said that. Stop making up quotes.*

[![Claude Rules](https://img.shields.io/badge/VERICARD-SIMPLIFIED-green)](https://github.com/vericard)