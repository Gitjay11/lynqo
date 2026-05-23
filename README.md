# Lynqo — Campus Community Platform

> Everything happening on campus — right here.

[![License: MIT](https://img.shields.io/badge/License-MIT-violet.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![CI](https://github.com/Gitjay11/lynqo/actions/workflows/ci.yml/badge.svg)](https://github.com/Gitjay11/lynqo/actions/workflows/ci.yml)

Lynqo is a full-stack, open-source campus community platform built exclusively for college students. Connect with your entire college through a real-time feed, anonymous confessions, direct messaging, and student profiles — all in one private space.

<img width="1866" height="805" alt="image" src="https://github.com/user-attachments/assets/f189f201-a7ee-44e0-a861-8bfc2150dc94" />


## Features

| Feature | Description |
|---|---|
| Community Feed | Post updates, memes, questions, and announcements |
| Anonymous Posting | Share confessions and opinions without revealing identity |
| Real-time Chat | One-on-one DMs with online indicators and typing status |
| Student Profiles | Discover students by branch and semester |
| Dark Theme | Deep violet and near-black premium UI |
| Mobile-first | Designed for phones first — fully responsive on all screen sizes |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v3 |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| Real-time | Socket.IO |
| Media | Cloudinary |
| Auth | JWT + bcryptjs |

---

## Getting Started

### Prerequisites

- [Node.js v20+](https://nodejs.org)
- [MongoDB Atlas account](https://cloud.mongodb.com) (free tier available)
- [Cloudinary account](https://cloudinary.com) (free tier available)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/Gitjay11/lynqo.git
cd lynqo
```

**2. Set up environment variables**
```bash
# Backend
cp backend/.env.example backend/.env
# Open backend/.env and fill in your MongoDB URI, JWT secret, and Cloudinary keys

# Frontend
cp frontend/.env.example frontend/.env
# The defaults work for local development
```

**3. Install dependencies**
```bash
# Backend
cd backend && npm install

# Frontend (new terminal)
cd frontend && npm install
```

**4. Run the development servers**
```bash
# Terminal 1 — Backend API
cd backend && npm run dev
# -> http://localhost:5000

# Terminal 2 — Frontend
cd frontend && npm run dev
# -> http://localhost:5173
```

---

## Project Structure

```
lynqo/
├── backend/
│   ├── config/        # Database connection
│   ├── controllers/   # Route business logic
│   ├── middleware/    # Auth, validation, error handling
│   ├── models/        # Mongoose schemas
│   ├── routes/        # Express API routes
│   ├── socket/        # Socket.IO event handlers
│   ├── utils/         # Shared helpers
│   └── server.js      # Entry point
│
└── frontend/
    └── src/
        ├── components/ # Reusable UI (feed, chat, common, landing)
        ├── pages/      # Route-level pages
        ├── hooks/      # Custom React hooks
        ├── context/    # Auth & Socket context providers
        └── lib/        # Axios instance, constants
```

---

## Contributing

Contributions are welcome. Whether it's a bug fix, a new feature, or a documentation improvement — we appreciate the help.

Please read **[CONTRIBUTING.md](CONTRIBUTING.md)** before opening a PR. It covers:
- Branch naming conventions
- Commit message format (Conventional Commits)
- The mobile-first design requirement
- How to set up your local environment

### Quick Start for Contributors

```bash
# 1. Fork the repo on GitHub
# 2. Clone your fork
git clone https://github.com/<your-username>/lynqo.git

# 3. Create a feature branch
git checkout -b feature/your-feature-name

# 4. Make your changes, then commit
git commit -m "feat(scope): description of change"

# 5. Push and open a Pull Request
git push origin feature/your-feature-name
```

Look for issues labeled **`good first issue`** if you are just getting started.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Author

**Ajay Rajera** — [@Gitjay11](https://github.com/Gitjay11)

---

If you find Lynqo useful, please star the repository — it helps others discover the project.
