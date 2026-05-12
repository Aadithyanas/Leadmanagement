# LeadFlow CRM ⚡

LeadFlow is an enterprise-grade Lead Management and Discovery platform designed to automate your sales pipeline. Built with a focus on high-fidelity visuals, automated proactive communication, and data-dense analytics.

![Landing Page Visual](https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426)

## ✨ Features

- **🚀 3D Interactive Landing Page**: High-performance Three.js hero section with real-time data node visualization.
- **📊 Advanced Analytics Hub**: Data-rich dashboard featuring Area charts, Pie charts, and Bar charts for pipeline health.
- **🔍 Intelligent Discovery**: Integrated Google Maps business scraping via Apify with Photon location intelligence.
- **📧 Automated Gmail Alerts**: Background worker that scans your pipeline and sends proactive follow-up summaries.
- **📱 Responsive Mobile-First Design**: Fully optimized for all devices with a sleek, drawer-based navigation.
- **🛠️ Centralized CRM**: Manage discussions, track statuses, and set follow-up dates in a beautiful, unified interface.

## 🛠️ Technology Stack

- **Frontend**: React, TypeScript, TailwindCSS, Framer Motion, Three.js, Lucide React.
- **Backend**: Node.js, Express, MongoDB (Mongoose), Nodemailer.
- **Infrastructure**: Background notification workers, Apify API integration.

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- Gmail account with "App Password" (for notifications)

### 2. Environment Setup

#### Frontend (`/.env`)
```bash
VITE_API_URL=http://localhost:5000/api
```

#### Server (`/server/.env`)
```bash
PORT=5000
MONGODB_URI=mongodb://localhost:27017/leadflow
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-google-app-password
ENABLE_NOTIFICATIONS=true
NOTIFICATION_EMAIL=your-email@gmail.com
APIFY_API_KEY=your_key_here
```

### 3. Installation
```bash
# Install frontend dependencies
npm install

# Install server dependencies
cd server
npm install

# Start both servers (in separate terminals)
# Frontend
npm run dev
# Server
npm run dev
```

## 📬 Automated Notifications
LeadFlow features a proactive background worker that runs every 24 hours. It identifies leads that require attention and sends a summarized report to your configured email. You can verify your setup using the **Test Notification** button in the Settings page.

## 🔒 Security
- **Encrypted Keys**: Sensitive API keys and SMTP credentials are managed via server-side environment variables.
- **Data Persistence**: All settings and leads are stored securely in your MongoDB instance.

---
Built with precision for modern sales teams.