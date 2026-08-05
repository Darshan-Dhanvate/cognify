# SYSTEM-ARCHITECTURE.md

## 1. System Architecture Overview

**Cognify Engine** is an intelligent, full-stack cognitive productivity platform designed to bridge task management with psychological behavioral insights.

```text
                  +-----------------------------------+
                  |      React + Tailwind Frontend    |
                  |     (3D WebGL / Canvas / Dashboard)|
                  +-----------------+-----------------+
                                    |
                                    v
                  +-----------------+-----------------+
                  |      Express.js API Gateway       |
                  |  (JWT Auth / REST / WebSockets)   |
                  +--------+----------------+---------+
                           |                |
             +-------------+                +-------------+
             v                                            v
  +----------+----------+                      +----------+----------+
  | MongoDB Database    |                      | Python ML Service   |
  | (Users, Tasks,      |                      | (Text Analysis,     |
  |  Journals, Logs)    |                      |  XGBoost / LightGBM)|
  +---------------------+                      +---------------------+
```

---

## 2. Module 1: The Command Center (MERN Core)

### Database Schemas (MongoDB / Mongoose)

#### A. User Schema (`models/User.js`)
```javascript
{
  _id: ObjectId,
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  cognitiveProfile: {
    burnoutThreshold: { type: Number, default: 75 }, // 0 to 100 score
    preferredFocusTime: { type: Number, default: 25 }, // minutes
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### B. Task & Dependency Schema (`models/Task.js`)
```javascript
{
  _id: ObjectId,
  user: { type: ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  status: { type: String, enum: ['Pending', 'In-Progress', 'Completed'], default: 'Pending' },
  isOverwhelming: { type: Boolean, default: false },
  
  // Relational Dependencies
  parentTask: { type: ObjectId, ref: 'Task', default: null },
  dependencies: [{ type: ObjectId, ref: 'Task' }],
  
  // AI-Generated Micro-Steps
  microSteps: [{
    title: { type: String, required: true },
    timeEstimate: { type: Number, default: 5 }, // in minutes
    isCompleted: { type: Boolean, default: false }
  }],
  
  estimatedTotalMinutes: { type: Number, default: 15 },
  completedAt: Date,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### C. Journal & Psychology Log Schema (`models/Journal.js`)
```javascript
{
  _id: ObjectId,
  user: { type: ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  
  // Populated by ML Microservice via text analysis
  psychologicalAnalysis: {
    stressScore: { type: Number, min: 0, max: 100 },
    detectedDistortions: [{ type: String }], // e.g. "Catastrophizing", "Black-and-White Thinking"
    suggestedReframing: { type: String },
    moodState: { type: String, enum: ['Calm', 'Anxious', 'Overwhelmed', 'Focused'] }
  },
  
  createdAt: Timestamp
}
```

---

## 3. Core API Endpoint Architecture

| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user & hash password | No |
| `POST` | `/api/auth/login` | Authenticate user & return JWT | No |
| `GET` | `/api/tasks` | Fetch user's hierarchical task graph | Yes |
| `POST` | `/api/tasks` | Create task & trigger Gemini AI micro-steps if `isOverwhelming` | Yes |
| `PATCH` | `/api/tasks/:id/step` | Toggle completion status of a micro-step | Yes |
| `POST` | `/api/journal` | Save journal entry & trigger ML text analysis microservice | Yes |