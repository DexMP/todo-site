import express, { Request, Response, NextFunction } from 'express';
import http from 'http'; // Added for Socket.IO
import { Server as SocketIOServer } from 'socket.io'; // Added for Socket.IO
import jwt from 'jsonwebtoken'; // To decode token for user ID

import authRoutes from './auth/auth.routes';
import projectRoutes from './projects/projects.routes';
import taskRoutes from './tasks/tasks.routes';
import { _getProjectsDB_for_projects, _getProjectMembersDB_for_tasks as getProjectMembers } from './projects/projects.controller'; // To get user's projects

const app = express();
const server = http.createServer(app); // Create HTTP server from Express app

// Initialize Socket.IO
export const io = new SocketIOServer(server, { // Export io instance
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000", // Adjust for your frontend URL
    methods: ["GET", "POST"]
  }
});

const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to parse JSON bodies
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('A user connected with socket ID:', socket.id);

  // Authenticate socket connection (simple example using token from handshake)
  const token = socket.handshake.auth.token;
  let userId: string | null = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
      userId = decoded.userId;
      console.log(`Socket user ${userId} authenticated for socket ${socket.id}`);

      // Join rooms for each project the user is a member of
      const projectsDB = _getProjectsDB_for_projects(); // In-memory DB access
      const projectMembersDB = getProjectMembers(); // In-memory DB access

      const ownedProjects = projectsDB.filter(p => p.owner_id === userId);
      const memberInProjects = projectMembersDB.filter(m => m.user_id === userId).map(m => m.project_id);

      const allProjectIds = new Set([
        ...ownedProjects.map(p => p.id),
        ...memberInProjects
      ]);

      allProjectIds.forEach(projectId => {
        socket.join(`project:${projectId}`);
        console.log(`User ${userId} (socket ${socket.id}) joined room project:${projectId}`);
      });

    } catch (err) {
      console.log('Socket authentication error:', err.message);
      socket.disconnect(true); // Disconnect if token is invalid
    }
  } else {
    console.log('Socket connection without token, disconnecting.');
    socket.disconnect(true); // Disconnect if no token
  }


  socket.on('disconnect', () => {
    console.log(`User ${userId || 'Unknown'} (socket ${socket.id}) disconnected`);
    // Rooms are automatically left on disconnect
  });

  // Example: User explicitly requests to join a project room after connection
  // socket.on('join_project_room', (projectId) => {
  //   // Add validation here: check if user is actually member of this project
  //   socket.join(`project:${projectId}`);
  //   console.log(`User ${userId} (socket ${socket.id}) explicitly joined room project:${projectId}`);
  // });
});


app.get('/', (req: Request, res: Response) => {
  res.send('Hello from the backend!');
});

// Basic Error Handling Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Placeholder for database connection details
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'user',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'mydatabase',
};

console.log(`Database configuration: ${JSON.stringify(dbConfig)}`);

// Use server.listen instead of app.listen
server.listen(port, () => {
  console.log(`Backend server with Socket.IO is running on http://localhost:${port}`);
});
