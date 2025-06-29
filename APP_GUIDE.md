# VeriCard Scan Pro - Web App Guide

## 🚀 First Launch

When you first open the web app at [http://localhost:3000](http://localhost:3000), you'll see:

### Home Screen
- **Scan Card** button - Main feature to scan trading cards
- **Recent Scans** - Shows your scan history (stored locally)
- **Quick Stats** - Total scans, accuracy rate, saved reports

### Navigation Menu
- 🏠 **Home** - Main dashboard
- 📷 **Scanner** - Camera scanning interface  
- 📊 **Dashboard** - Analytics and reports
- 💳 **Subscription** - Manage your plan
- ⚙️ **Settings** - App configuration

## 🌐 Core Features

### 1. Card Scanning Flow
1. Click **Scan Card** or Scanner link
2. Allow camera permissions when prompted
3. Position card in frame
4. App will guide you through:
   - Front capture
   - Back capture  
   - Edge captures (4 angles)
5. Canvas-based UV filter simulation
6. TensorFlow.js processes images in <1 second

### 2. Damage Detection
The AI will detect:
- Surface scratches
- Corner wear
- Edge damage
- Centering issues
- Print defects
- UV damage indicators

### 3. Verification Results
After scanning, you'll see:
- Overall condition grade (1-10)
- Detailed damage report
- Confidence score (0-100%)
- Market value estimate
- Authentication status

### 4. Report Generation
From scan results, generate:
- **PSA Submission** - Pre-filled forms
- **eBay Listing** - Optimized descriptions
- **Insurance Report** - For high-value cards
- **Topps Authentication** - For modern cards

### 5. Local-First Storage
All data stored locally using:
- IndexedDB via Dexie.js
- No cloud sync required
- Export/import capabilities
- Privacy by default

## 💰 Subscription Tiers

### Basic ($49/month)
- 500 scans per month
- Basic reports
- Email support

### Pro ($149/month)
- 2000 scans per month
- Advanced AI features
- Priority support
- Bulk operations

## 🔧 Settings

### Camera Settings
- **Resolution** - HD/4K options
- **Auto-Capture** - Toggle automatic capture
- **Guidelines** - Show/hide frame guides

### AI Settings
- **Confidence Threshold** - Default 85%
- **Processing Mode** - Local/Cloud hybrid
- **Batch Mode** - For multiple cards

### Privacy & Security
- **Local Storage** - All data stays on device
- **Clear Data** - Remove all local data
- **Export Data** - Download your data

## 💻 Browser Requirements

### Supported Browsers
- Chrome 90+ (Recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

### Required Features
- WebRTC for camera access
- WebGL for TensorFlow.js
- IndexedDB for storage

## 📞 Test Features

Since we're in development mode:
- Stripe payments use test cards
- AI runs with sample models
- All data is local only
- No real charges occur

### Test Credit Cards
- `4242 4242 4242 4242` - Success
- `4000 0000 0000 0002` - Decline
- Any future date for expiry
- Any 3 digits for CVC

## 🐛 Known Issues

1. **Camera Permission** - HTTPS required (localhost works)
2. **Mobile Browsers** - Limited support, desktop recommended
3. **Storage Limits** - Browser may limit to 50MB

## 🖱️ Interface Tips

- **Click & Drag** - Adjust scan area
- **Scroll** - Navigate between captures
- **Right Click** - Quick actions menu
- **Keyboard Shortcuts**:
  - `Space` - Capture image
  - `Enter` - Confirm scan
  - `Esc` - Cancel operation

## 🎯 Pro Tips

1. **Best Scanning**:
   - Use good lighting
   - Avoid reflections
   - Keep card flat
   - Clean camera lens

2. **Batch Scanning**:
   - Use continuous mode
   - Group by set
   - Export CSV reports

3. **High-Value Cards**:
   - Maximum resolution
   - Multiple angles
   - Generate all reports

## 🆘 Troubleshooting

**Camera Not Working**: 
- Check HTTPS/localhost
- Allow camera permissions
- Try different browser

**Slow Performance**: 
- Close other tabs
- Check WebGL support
- Clear browser cache

**Storage Full**: 
- Export old scans
- Clear completed reports
- Check browser storage quota

## 🔐 Data Privacy

- All processing happens in your browser
- No data sent to servers unless you explicitly sync
- You own and control all your scan data
- Export anytime in standard formats

---

Happy Scanning! 🎉