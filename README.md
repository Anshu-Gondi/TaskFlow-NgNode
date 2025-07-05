# TaskFlow-NgNode

A full-stack collaborative to-do and team productivity app built with Angular, Node.js, Express, and MongoDB.  
Supports solo and team workspaces, AI-powered scheduling, Google and email authentication, and a modern glassmorphism UI.

---

## Features

- **Solo & Team Workspaces:**  
  Organize personal and shared lists, tasks, and projects.

- **Role-based Team Management:**  
  Admin, editor, and viewer roles. Invite, promote, demote, or remove members.

- **AI Scheduler:**  
  Get optimized task order suggestions using a FastAPI microservice.

- **Google & Email Auth:**  
  Sign up or log in with Google or email/password.

- **Modern UI:**  
  Responsive, glassmorphism, and neon-inspired design.

---

## Project Structure

```
api/                # Node.js/Express backend (REST API)
  db/               # Mongoose models (User, GoogleUser, Team, Task, etc.)
  middleware/       # Express middleware (auth, role checks)
  utils/            # Utility functions (email, etc.)
  ai-schedular/     # FastAPI microservice for AI scheduling
frontend/           # Angular 17+ SPA (standalone components)
  src/app/          # Angular app source (pages, services, models)
  src/styles.scss   # Global styles (glassmorphism, neon, etc.)
```

---

## Getting Started

### Prerequisites

- Node.js (18+ recommended)
- Python 3.9+ (for AI scheduler)
- MongoDB (local or Atlas)
- Angular CLI (`npm install -g @angular/cli`)
- [Resend](https://resend.com/) API key for email notifications (optional)

---

### 1. Backend Setup (`api/`)

```bash
cd api
npm install
```

- Create a `.env` file with:
  ```
  MONGODB_URI=your_mongodb_connection_string
  JWT_SECRET=your_jwt_secret
  CLIENT_ID=your_google_client_id
  RESEND_API_KEY=your_resend_api_key
  RESEND_FROM=your_verified_email
  ```

- Start the server:
  ```bash
  node app.js
  # or with nodemon for auto-reload
  npx nodemon app.js
  ```

#### AI Scheduler (Python/FastAPI)

```bash
cd api/ai-schedular
pip install fastapi uvicorn pydantic
uvicorn main:app --reload --port 5001
```

---

### 2. Frontend Setup (`frontend/`)

```bash
cd frontend
npm install
ng serve
```

- Visit [http://localhost:4200](http://localhost:4200)

---

## Key Files

- **api/app.js**  
  Main Express server, REST API routes for lists, tasks, teams, users, AI, etc.

- **api/db/models/**  
  Mongoose schemas for User, GoogleUser, Team, Task.

- **api/ai-schedular/**  
  FastAPI microservice for AI task scheduling.

- **frontend/src/app/pages/**  
  Angular standalone components for login, signup, task view, team hub, AI scheduler, etc.

- **frontend/src/app/auth.service.ts**  
  Handles authentication, token management, Google sign-in.

- **frontend/src/app/team-service.service.ts**  
  Team and member management API calls.

- **frontend/src/app/task.service.ts**  
  List and task CRUD, AI schedule integration.

- **frontend/src/styles.scss**  
  Global glassmorphism and neon theme.

---

## API Overview

- `POST /users`, `POST /users/login`, `POST /users/google-signin`
- `GET /lists`, `POST /lists`, `PATCH /lists/:id`, `DELETE /lists/:id`
- `GET /lists/:listId/tasks`, `POST /lists/:listId/tasks`, etc.
- `POST /teams`, `POST /teams/join`, `GET /teams`, `GET /teams/:teamId/members`
- `PATCH /teams/:teamId/members/:userId`, `DELETE /teams/:teamId/members/:userId`
- `POST /ai/schedule` (calls FastAPI microservice)

---

## Customization

- **Styling:**  
  Edit `frontend/src/styles.scss` and page-level `.scss` files for theme tweaks.

- **AI Scheduler:**  
  Modify `api/ai-schedular/scheduler.py` for custom scheduling logic.

- **Email:**  
  Uses [Resend](https://resend.com/) for transactional emails. Configure in `.env`.

---

## License

MIT

---

## Credits

- Angular, Node.js, Express, MongoDB, FastAPI, Bulma, FontAwesome, Resend, Google Identity Services

---