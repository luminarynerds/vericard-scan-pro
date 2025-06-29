# VeriCard Scan Pro - Architecture Overview

## 🏗️ System Architecture

VeriCard Scan Pro is built as a modern web application using a local-first architecture that prioritizes user privacy and offline functionality. The project has been cleaned up to focus on web-only implementation, removing mobile components and unnecessary complexity.

```mermaid
graph TB
    subgraph "Client (Browser)"
        A[Next.js Frontend] --> B[React Components]
        B --> C[TensorFlow.js]
        B --> D[react-webcam]
        B --> E[Dexie.js/IndexedDB]
        C --> F[AI Processing]
        D --> G[Camera Capture]
        E --> H[Local Storage]
    end
    
    subgraph "Cloud Services (Optional)"
        I[REST API] --> J[PostgreSQL]
        K[Stripe API] --> L[Payment Processing]
        M[Cloud AI] --> N[Advanced Processing]
    end
    
    A -.-> I
    A --> K
    F -.-> M
```

## 📁 Project Structure

```
vericard-scan-pro/
├── apps/
│   ├── web/                    # Next.js web application
│   │   ├── src/
│   │   │   ├── app/           # App router pages
│   │   │   ├── components/    # React components
│   │   │   ├── services/      # Business logic
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   └── utils/         # Utility functions
│   │   └── public/            # Static assets
│   │
│   └── api/                   # Backend API (future)
│       ├── src/
│       └── prisma/
│
├── libs/                      # Shared libraries
│   ├── core/                  # Core business logic
│   │   ├── src/
│   │   │   ├── models/       # Data models
│   │   │   ├── validators/   # Input validation
│   │   │   └── constants/    # Shared constants
│   │   └── package.json
│   │
│   └── ai/                    # AI/ML functionality
│       ├── src/
│       │   ├── models/       # TensorFlow models
│       │   ├── processors/   # Image processing
│       │   └── analyzers/    # Card analysis
│       └── package.json
│
├── docs/                      # Documentation
├── scripts/                   # Build/utility scripts
└── infra/                     # Infrastructure config
```

## 🔧 Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.3+
- **UI Library**: React 18
- **Styling**: Tailwind CSS + Radix UI
- **State Management**: React Context + Hooks
- **Camera**: react-webcam
- **Database**: Dexie.js (IndexedDB wrapper)

### AI/ML
- **Framework**: TensorFlow.js
- **Models**: Currently using COCO-SSD as placeholder (custom model in development)
- **Processing**: Client-side inference with <0.8s target
- **Fallback**: Cloud API for low confidence (<85%) or high-value cards (>$100)
- **Cost**: $0.0001/scan for local processing

### Infrastructure
- **Monorepo**: pnpm workspaces
- **Build**: Turbo (future)
- **Testing**: Jest + Playwright
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel/Netlify

## 🏛️ Key Design Principles

### 0. Simplicity First
- Ship working features before adding complexity
- Avoid premature optimization
- Document what exists, not what's planned

### 1. Local-First Architecture
- All data processing happens in the browser
- No required internet connection for core features
- User data never leaves device without explicit consent
- IndexedDB for persistent local storage

### 2. Progressive Enhancement
- Basic features work on all modern browsers
- Advanced features (AI, camera) gracefully degrade
- Cloud services are optional enhancements

### 3. Privacy by Design
- No tracking or analytics by default
- All data encrypted in local storage
- Explicit user consent for any cloud sync
- Data export/import capabilities

### 4. Performance Optimization
- Code splitting for faster initial load
- Lazy loading of AI models
- Service worker for offline support
- Optimistic UI updates

## 🔄 Data Flow

### Scanning Workflow
```mermaid
sequenceDiagram
    participant User
    participant UI
    participant Camera
    participant AI
    participant DB
    participant Cloud
    
    User->>UI: Initiate Scan
    UI->>Camera: Request Permission
    Camera->>UI: Stream Video
    User->>UI: Capture Image
    UI->>AI: Process Image
    AI->>AI: Local Analysis
    alt Low Confidence
        AI->>Cloud: Request Cloud Analysis
        Cloud->>AI: Enhanced Results
    end
    AI->>UI: Return Results
    UI->>DB: Store Results
    UI->>User: Display Results
```

### Data Storage
```mermaid
graph LR
    A[Scan Data] --> B{Storage Layer}
    B --> C[IndexedDB]
    C --> D[Scans Table]
    C --> E[Reports Table]
    C --> F[Settings Table]
    C --> G[Cache Table]
```

## 🔐 Security Architecture

### Client-Side Security
- Content Security Policy (CSP)
- Subresource Integrity (SRI)
- HTTPS enforcement
- Input sanitization

### Data Security
- IndexedDB encryption (planned)
- Secure key storage
- No sensitive data in localStorage
- Memory cleanup after processing

### API Security (Future)
- JWT authentication
- Rate limiting
- API key rotation
- CORS configuration

## 🚀 Deployment Architecture

### Web App Deployment
```mermaid
graph LR
    A[GitHub] --> B[CI/CD Pipeline]
    B --> C[Build Process]
    C --> D[CDN]
    D --> E[Edge Locations]
    E --> F[Users]
```

### Scaling Strategy
1. **Static Generation**: Pre-render marketing pages
2. **Edge Functions**: API routes at edge locations
3. **CDN**: Assets served from global CDN
4. **Local Processing**: Computation on user devices

## 📊 Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Initial Load | < 3s | TBD |
| Time to Interactive | < 5s | TBD |
| Scan Processing | < 0.8s | Achieved (with placeholder model) |
| Report Generation | < 3s | TBD |
| Test Coverage | 85% | In Progress |

## 🔄 Future Architecture Enhancements

### Phase 1: Current (Local-Only)
- Browser-based processing ✅
- TensorFlow.js integration ✅
- Basic test infrastructure ✅
- IndexedDB storage 🚧
- Custom AI model 🚧

### Phase 2: Hybrid (Planned)
- Optional cloud sync
- Enhanced AI models
- Multi-device support
- Real-time collaboration

### Phase 3: Enterprise (Future)
- Self-hosted options
- Advanced analytics
- Team management
- API access

## 🧩 Integration Points

### Payment Processing
- Stripe Checkout for subscriptions
- Webhook handling for payment events
- Subscription status in IndexedDB

### Export/Import
- JSON format for data portability
- CSV export for reports
- PDF generation for documents

### Third-Party Services
- Stripe (payments)
- Vercel/Netlify (hosting)
- GitHub (version control)
- npm/pnpm (package management)

---

This architecture is designed to be simple, scalable, and respectful of user privacy while delivering a powerful card verification platform.

## 🚨 Important Notes

1. **AI Model**: Currently using COCO-SSD for object detection as a placeholder. Production will require a custom-trained model specifically for card detection and damage analysis.

2. **Blockchain**: References to blockchain features are aspirational. No blockchain code is currently implemented.

3. **Libraries**: The `libs/core` and `libs/ai` directories have package structure but no implementation yet. This follows the "structure ready, implementation pending" approach.

4. **Testing**: Test infrastructure is in place with Jest and React Testing Library. Coverage targets are set at 85% but not yet achieved.

5. **Performance**: The 0.8s processing time is achieved with the placeholder model. Real card analysis may require optimization.