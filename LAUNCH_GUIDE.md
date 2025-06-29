# 🚀 VeriCard Scan Pro - Launch Guide

## Prerequisites

### For Web Development
1. **Node.js 18+** - Install from [nodejs.org](https://nodejs.org/)
2. **pnpm** - Install with: `npm install -g pnpm`
3. **Modern Browser** - Chrome/Firefox/Safari with camera support

## 🎯 Quick Launch

### Step 1: Install Dependencies
```bash
cd /Users/sam/projects/vericard-scan-pro
pnpm install
```

### Step 2: Start Development Server
```bash
cd apps/web
npm run dev
```

### Step 3: Open in Browser
Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Features You'll See

1. **Welcome Screen** - VeriCard logo and feature highlights
2. **Camera Scanner** - AI-powered card verification (TensorFlow.js)
3. **Multi-angle Capture** - Comprehensive card analysis
4. **Reports** - PSA/eBay/Topps format generation
5. **Subscription Tiers** - Basic ($49) and Pro ($149)

## 🔧 Troubleshooting

### Common Issues
- **"Port 3000 in use"** → Kill the process: `lsof -ti:3000 | xargs kill -9`
- **Camera not working** → Ensure HTTPS or localhost (camera requires secure context)
- **Build errors** → Clear cache: `rm -rf .next && npm run dev`

### Environment Setup
Create `.env.local` file in `apps/web`:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
STRIPE_SECRET_KEY=your_stripe_secret
```

## 🎨 Development Mode

The app runs in development mode with:
- Fast refresh enabled
- Error overlay for debugging
- Source maps for debugging
- Console logs visible in browser DevTools

## 📦 Building for Production

### Build the app
```bash
cd apps/web
npm run build
```

### Start production server
```bash
npm start
```

### Deploy to Vercel (recommended)
```bash
npx vercel
```

## 🔐 Important Notes

- The app requires camera permissions for scanning
- Browser must support WebRTC for camera access
- Stripe integration requires test keys for development
- Local-first architecture means full functionality even offline

## 🚨 Current Status

✅ Phase 1: Foundation - Complete
✅ Phase 2: Core Features - Complete  
✅ Phase 3: Monetization - Complete
🎯 Ready for deployment!

## 💰 Revenue Features

- **Subscriptions**: Basic ($49) and Pro ($149) tiers via Stripe
- **Commission Engine**: 3% platform fee on all transactions
- **Usage Tracking**: 500 scans (Basic) / 2000 scans (Pro)
- **PCI Compliant**: Level 4 SAQ A-EP compliance