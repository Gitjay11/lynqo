# Contributing to Lynqo

Thank you for your interest in contributing to Lynqo.  
This guide covers everything you need to know to make a great contribution.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Project Architecture](#project-architecture)
- [Branch Naming Convention](#branch-naming-convention)
- [Commit Message Format](#commit-message-format)
- [Mobile-First Rule](#mobile-first-rule)
- [Pull Request Process](#pull-request-process)
- [What to Work On](#what-to-work-on)

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Be respectful, inclusive, and constructive.

---

## Getting Started

### 1. Fork and Clone

```bash
# Fork via GitHub UI, then:
git clone https://github.com/<your-username>/lynqo.git
cd lynqo
```

### 2. Set Up Environment Variables

```bash
# Backend
cp backend/.env.example backend/.env
# Fill in your MongoDB URI, JWT secret, and Cloudinary credentials

# Frontend
cp frontend/.env.example frontend/.env
# Defaults work for local development
```

### 3. Install Dependencies

```bash
# Backend
cd backend && npm install

# Frontend (open a new terminal)
cd frontend && npm install
```

### 4. Run the Development Servers

```bash
# Terminal 1 — Backend
cd backend && npm run dev
# Runs on http://localhost:5000

# Terminal 2 — Frontend
cd frontend && npm run dev
# Runs on http://localhost:5173
```

---

## Project Architecture

```
lynqo/
├── backend/
│   ├── config/          # Database connection (db.js)
│   ├── controllers/     # Route handler logic
│   ├── middleware/      # Auth, error handling, validation
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express route definitions
│   ├── socket/          # Socket.IO event handlers
│   ├── utils/           # Shared helpers (cloudinary, etc.)
│   └── server.js        # Entry point
│
└── frontend/
    └── src/
        ├── components/  # Reusable UI components
        │   ├── common/  # Layout, nav, skeletons, error boundary
        │   ├── feed/    # Post cards, feed widgets
        │   ├── chat/    # Chat list, message bubbles
        │   └── landing/ # Marketing page sections
        ├── pages/       # Route-level page components
        ├── hooks/       # Custom React hooks
        ├── context/     # React Context providers (Auth, Socket)
        ├── lib/         # Axios instance, constants
        └── index.css    # Global styles + Tailwind base
```

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v3 |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas + Mongoose |
| Real-time | Socket.IO |
| Media | Cloudinary |
| Auth | JWT + bcryptjs |

---

## Branch Naming Convention

Use the following prefixes:

| Type | Pattern | Example |
|---|---|---|
| New feature | `feature/<short-description>` | `feature/post-reactions` |
| Bug fix | `fix/<short-description>` | `fix/chat-scroll-bug` |
| UI/UX work | `ui/<short-description>` | `ui/profile-avatar` |
| Refactor | `refactor/<short-description>` | `refactor/auth-middleware` |
| Documentation | `docs/<short-description>` | `docs/api-reference` |
| Config/tooling | `chore/<short-description>` | `chore/update-deps` |

---

## Commit Message Format

We follow **Conventional Commits**:

```
<type>(<scope>): <short description>

[optional body]
[optional footer]
```

**Types:** `feat`, `fix`, `ui`, `refactor`, `docs`, `chore`, `test`  
**Scope:** `frontend`, `backend`, `auth`, `chat`, `feed`, `profile`, `socket`

**Examples:**
```
feat(feed): add image upload to post creation
fix(chat): resolve message duplication on reconnect
ui(profile): improve avatar crop on mobile
docs(contributing): add branch naming convention
```

---

## Mobile-First Rule

> This is non-negotiable. Every frontend contribution must follow it.

- Design for **375px width first**, then scale up with `sm:`, `md:`, `lg:` breakpoints
- All touch targets (buttons, links, tabs) must be **at least 44px tall**
- **Zero horizontal scrolling** on any screen size
- Test your changes in Chrome DevTools with the mobile device toolbar open

---

## Pull Request Process

1. Ensure your branch is up to date with `main`:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```
2. Run the linter before pushing:
   ```bash
   cd frontend && npm run lint
   ```
3. Fill in the [PR template](.github/pull_request_template.md) completely — especially screenshots for UI changes
4. One feature or fix per PR — keep it focused
5. A maintainer will review within a few days. Address feedback promptly.

---

## What to Work On

- **`good first issue`** — great for new contributors, well-scoped tasks
- **`help wanted`** — open to contributors, may need some experience
- **`bug`** — confirmed bugs that need fixing

Browse open issues: [github.com/Gitjay11/lynqo/issues](https://github.com/Gitjay11/lynqo/issues)

**Before starting work:** Comment on the issue to claim it, so we avoid duplicate effort.
