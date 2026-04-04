# 🏏 VSBH Cricket League (VSBH-CL)

🚀 A full-stack real-time college cricket league management system featuring live auction, dynamic team creation, fixtures, stats, and leaderboard.

---

## 📌 Overview

VSBH-CL is a modern web application designed to simulate an IPL-style cricket league at the college level.

It includes:
- 🔥 Real-time Auction System
- 👥 Team Creation with Captain Codes
- 📊 Stats & Leaderboard
- 📅 Fixtures & Points Table
- 📡 Live Updates using Socket.IO
- 📄 Player Registration via Google Forms

---

## 🎯 Key Features

### 🧑‍💼 Admin
- Start and control auction
- Manage teams and fixtures
- Monitor live bidding

### 👑 Captain
- Create team dynamically
- Receive unique captain code
- Login using captain code
- Participate in auction

### 👀 Viewer
- Watch live auction
- View teams, stats, fixtures
- No login required

---

## ⚙️ Tech Stack

### Frontend
- React (TypeScript)
- CSS (No Tailwind)
- Socket.IO Client

### Backend
- Node.js
- Express.js
- Socket.IO

### Database
- Supabase (PostgreSQL)

### Integration
- Google Sheets API (via Google Forms)

---

## 🏗️ Project Structure

VSBH_CL/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── styles/
│
├── server/          # Backend
│   ├── routes/
│   ├── services/
│   ├── config/
│   ├── utils/
│
├── database/
│   └── schema.sql

---

## 🚀 Getting Started

### 🔧 Prerequisites

- Node.js (v18+)
- npm or yarn
- Supabase account
- Google Cloud account

---

## ⚡ 1. Clone Repository

git clone https://github.com/pathakpk7/vsbh-cricleague.git
cd vsbh-cricleague

---

## ⚙️ 2. Setup Backend

cd server  
npm install  

### Create .env file inside /server

PORT=5000  
SUPABASE_URL=your_supabase_url  
SUPABASE_KEY=your_supabase_key  
GOOGLE_SHEETS_ID=your_google_sheet_id  
GOOGLE_SHEETS_NAME=Form Responses 1  

---

### 🔑 Add Google Service Key

Place your file here:

/server/config/google-key.json

---

## 🗄️ 3. Setup Database (Supabase)

Go to Supabase → SQL Editor and run:

CREATE TABLE teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE,
  captain_code text,
  budget integer DEFAULT 1000
);

CREATE TABLE players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  role text,
  base_price integer DEFAULT 10,
  status text DEFAULT 'available'
);

CREATE TABLE auction_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid,
  player_name text,
  team_id uuid,
  team_name text,
  bid_amount integer,
  event_type text,
  created_at timestamp DEFAULT now()
);

---

## 🌐 4. Setup Frontend

cd client  
npm install  
npm start  

---

## ▶️ 5. Run Backend

cd server  
node index.js  

---

## 🌍 App URLs

Frontend: http://localhost:3000  
Backend: http://localhost:5000  

---

## 🔄 Data Flow

Google Form  
↓  
Google Sheets  
↓  
Backend Sync API  
↓  
Supabase Database  
↓  
React UI  

---

## 🔥 Auction System Logic

- Server controls all bidding
- Timer handled on backend
- Real-time updates via Socket.IO
- Budget validation before bid
- Player sold only via backend
- Atomic operations for money handling

---

## 🔐 Security Features

- Backend-controlled bidding
- Captain code verification
- Budget validation
- Duplicate team prevention
- No direct DB access from frontend

---

## 📊 Features Implemented

- Live Auction System
- Dynamic Team Creation
- Captain Code Login
- Google Form Integration
- Auction History Tracking
- Fixtures System
- Points Table
- Real-time Updates

---

## 🧠 Future Improvements

- Payment integration
- Notifications system
- Advanced analytics
- Mobile responsiveness
- Deployment (Vercel + Render)

---

## 👨‍💻 About Me

Name: Prasoon Pathak  
Student | Developer  

### Interests:
- Full Stack Development
- Real-time Systems
- Hackathon
- AI-based Applications

---

## 💡 Project Motivation

This project was built to simulate a real-world IPL-style auction system at a college level with:

- Real-time architecture
- Scalable backend
- Clean UI/UX
- Practical system design

---

## 🤝 Contributing

Pull requests are welcome.  
Open an issue before major changes.

---

## ⭐ Support

If you like this project, give it a star ⭐

---

## 📬 Contact

Email: prasoon7pathak@gmail.com  
LinkedIn: (https://www.linkedin.com/in/prasoon7pathak07/)

---

## 🏁 Final Note

This is not just a project — it is a real system design implementation.

🔥 Built with passion for cricket and code 🏏💻