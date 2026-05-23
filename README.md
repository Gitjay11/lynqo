# Lynqo — Campus Community Platform

> Everything happening on campus — right here.

Lynqo is a full-stack, open-source campus community platform 
built exclusively for college students. Connect with your entire 
college through a real-time feed, anonymous confessions, direct 
messaging, and student profiles — all in one private space.

<img width="1866" height="805" alt="image" src="https://github.com/user-attachments/assets/f189f201-a7ee-44e0-a861-8bfc2150dc94" />


## ✨ Features

- 📢 **Community Feed** — post updates, memes, questions, announcements
- 👻 **Anonymous Posting** — confess and share opinions without revealing identity
- 💬 **Real-time Chat** — one-on-one messaging with online status and typing indicators
- 👤 **Student Profiles** — find students by branch and semester
- 🌙 **Dark Theme** — deep violet and near-black UI
- 📱 **Mobile-first** — fully responsive on all screen sizes

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| Real-time | Socket.IO |
| Media | Cloudinary |
| Auth | JWT + bcrypt |

## 🚀 Getting Started

### Prerequisites
- Node.js v20+
- MongoDB Atlas account (free)
- Cloudinary account (free)

### Installation

1. Clone the repository
   git clone https://github.com/yourusername/lynqo.git
   cd lynqo

2. Install backend dependencies
   cd backend
   npm install

3. Install frontend dependencies
   cd ../frontend
   npm install

4. Set up environment variables
   
   Backend — create backend/.env
   PORT=5000
   MONGO_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=7d
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   NODE_ENV=development

   Frontend — create frontend/.env
   VITE_API_BASE_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000

5. Run the development servers

   Backend
   cd backend
   npm run dev

   Frontend (new terminal)
   cd frontend
   npm run dev

6. Open http://localhost:5173

## 📁 Project Structure

backend/          Node.js + Express API
frontend/         React + Vite application
README.md

## 🤝 Contributing

Contributions are welcome. Please read CONTRIBUTING.md first.

1. Fork the repository
2. Create your feature branch (git checkout -b feature/your-feature)
3. Commit your changes (git commit -m 'Add some feature')
4. Push to the branch (git push origin feature/your-feature)
5. Open a Pull Request

## 📜 License

MIT License — see LICENSE file for details.

## 👨‍💻 Author

Your Name — Ajay Rajera

---

⭐ If you find this useful, please star the repository!
