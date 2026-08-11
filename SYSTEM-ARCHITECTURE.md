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

#### B. Advanced Task & Dependency Schema (`models/Task.js`)
```javascript
{
  _id: ObjectId,
  user: { type: ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  
  // Cognitive Classification
  taskType: { type: String, enum: ['deep-work', 'quick-task', 'strict-event'], default: 'deep-work' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  status: { type: String, enum: ['Pending', 'In-Progress', 'Completed'], default: 'Pending' },
  isOverwhelming: { type: Boolean, default: false },
  
  // Dual-Date Architecture
  scheduledDate: { type: Date, default: null }, // Execution Intention
  dueDate: { type: Date, default: null },       // Hard Deadline
  
  // Relational Dependencies & Roll-Ups
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
| `PUT` | `/api/tasks/:id` | Update task status, dates, metadata, and micro-steps | Yes |
| `DELETE`| `/api/tasks/clear` | Wipe all user tasks (Database Nuke) | Yes |
| `DELETE`| `/api/tasks/:id` | Permanently delete a specific task | Yes |
| `POST` | `/api/journal` | Save journal entry & trigger ML text analysis microservice | Yes |

---

## 4. Internal API Gateway (Phase 2 Blueprint)

To keep the application highly performant, the Node.js Express server acts as a Gateway. It handles UI requests, standard database mutations, and authentication. For heavy computational tasks, Express relays data to the Python Brain.

*   **Trigger:** User submits a cognitive journal entry via React.
*   **Relay:** Express catches the entry and sends a `POST` request to `http://localhost:5000/analyze` (Python Service).
*   **Compute:** Python processes the text, calculates burnout trajectories utilizing ensemble models, and returns the analytics.
*   **Commit:** Express merges the ML insights with the journal entry and saves the complete package to MongoDB.

---

## 🚀 Project Development Roadmap & Current Status

### 📍 Phase 1: Command Center (Core Platform)
The Command Center forms the foundation of Cognify Engine, responsible for intelligent task management, AI-powered planning, user workflows, and data management.

*   ✅ Database architecture with optimized MongoDB schemas
*   ✅ User authentication and authorization system
*   ✅ Secure API architecture and protected routes
*   ✅ User registration and login interface
*   ✅ AI integration using Google Gemini for automatic task decomposition
*   ✅ Task creation and intelligent micro-step generation
*   ✅ Frontend execution workflow with priority roll-ups
*   ✅ Aligned Focus Mode with Leaf-Node Isolation algorithm
*   ✅ Dynamic Calendar & Scheduling Module (Dual-Date support)
*   ✅ Cognitive Journaling interface

### 🧠 Phase 2: Analytical Engine (AI & Machine Learning)
The Analytical Engine provides intelligent behavioral analysis and personalized productivity insights.

*   🔄 Python-based AI microservice integration
*   🔄 REST API communication with the main Node application
*   ⏳ Burnout prediction using XGBoost and LightGBM ensemble models
*   ⏳ NLP-based journal sentiment and cognitive analysis
*   ⏳ Personalized productivity recommendations
*   ⏳ Adaptive workload optimization

### 🌍 Phase 3: 3D Cognitive Sanctuary
The Cognitive Sanctuary transforms productivity data into an immersive and adaptive visual experience.

*   ⏳ Integration using React Three Fiber and Three.js
*   ⏳ Interactive 3D productivity environment
*   ⏳ Dynamic lighting and environmental transitions
*   ⏳ Visual representation of stress and focus levels
*   ⏳ Real-time synchronization with AI-generated productivity insights