# lynqo 🎓

**Campus Community Platform** — A private, college-exclusive social networking web app for students to connect, communicate, and engage within their campus ecosystem.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) + Tailwind CSS v3 |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas |
| Real-time | Socket.IO |
| Media | Cloudinary |
| Auth | JWT + bcryptjs |

---

## Project Structure

```
lynqo/
├── backend/    # Node.js + Express API server
└── frontend/   # React + Vite client app
```

---

## Getting Started

### Backend
```bash
cd backend
cp .env.example .env   # Fill in your credentials
npm run dev
```

### Frontend
```bash
cd frontend
cp .env.example .env   # Fill in your API URL
npm run dev
```

---

## Environment Variables

See `backend/.env` and `frontend/.env` for required keys.  
**Never commit `.env` files to Git.**

---

*Built with ❤️ for college students.*
