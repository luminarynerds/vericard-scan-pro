# VeriCard Scan Pro

Enterprise-grade card verification and scanning platform with local-first architecture.

## 🚀 Overview

VeriCard Scan Pro is a web-based application for professional card authentication and verification. Built with Next.js and TypeScript, it provides AI-powered card analysis, multi-angle capture, and comprehensive reporting capabilities.

## ✨ Features

- **AI-Powered Verification**: TensorFlow.js integration for real-time card analysis
- **Multi-Angle Capture**: Comprehensive card documentation workflow
- **Local-First Architecture**: Works offline with Dexie.js database
- **Professional Reports**: Generate PSA, eBay, and Topps format reports
- **Subscription Tiers**: Basic ($49/month) and Pro ($149/month) plans
- **Commission Engine**: 3% platform fee on transactions

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **AI/ML**: TensorFlow.js
- **Camera**: react-webcam
- **Database**: Dexie.js (IndexedDB)
- **Payments**: Stripe
- **Monorepo**: pnpm workspaces

## 📦 Project Structure

```
vericard-scan-pro/
├── apps/
│   ├── web/          # Next.js web application
│   └── api/          # Backend API (placeholder)
├── libs/
│   ├── core/         # Shared business logic
│   └── ai/           # AI/ML functionality
├── docs/             # Documentation
├── scripts/          # Build and utility scripts
└── infra/            # Infrastructure configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Modern browser with camera support

### Installation

```bash
# Clone the repository
git clone https://github.com/luminarynerds/vericard-scan-pro.git
cd vericard-scan-pro

# Install dependencies
pnpm install

# Start development server
cd apps/web
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Setup

Create `.env.local` in `apps/web`:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
```

## 🧪 Development

```bash
# Run all apps in development
pnpm dev

# Run tests
pnpm test

# Lint code
pnpm lint

# Build for production
pnpm build
```

## 📱 Features in Detail

### Card Verification
- Real-time AI analysis using TensorFlow.js
- Multi-angle capture workflow
- Damage detection and grading assistance
- Authenticity verification

### Reporting
- Professional PDF report generation
- PSA, eBay, and Topps formats
- Customizable templates
- Export capabilities

### Subscription Management
- **Basic Plan** ($49/month): 500 scans, basic features
- **Pro Plan** ($149/month): 2000 scans, advanced features
- Stripe integration for secure payments

## 🚀 Deployment

### Vercel (Recommended)

```bash
cd apps/web
npx vercel
```

### Self-Hosted

```bash
# Build the application
cd apps/web
npm run build

# Start production server
npm start
```

## 🔐 Security

- Local-first architecture ensures data privacy
- No data leaves the browser unless explicitly synced
- PCI compliant payment processing via Stripe
- Secure camera access via HTTPS

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with Next.js and React
- AI capabilities powered by TensorFlow.js
- Payment processing by Stripe

---

**VeriCard Scan Pro** - Professional card verification made simple.