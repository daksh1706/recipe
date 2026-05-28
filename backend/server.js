import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// WebSockets link for real-time dashboard events
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.use(cors());
app.use(express.json());

// Inject WebSocket instance in requests
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Import route files
import authRoutes from './routes/authRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import userRoutes from './routes/userRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import wasteRoutes from './routes/wasteRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import workspaceRoutes from './routes/workspaceRoutes.js';

// Import session middlewares
import { protect } from './middleware/authMiddleware.js';
import { workspaceProtect } from './middleware/workspaceMiddleware.js';

// Map API endpoints
app.use('/api/auth', authRoutes);
app.use('/api/workspace', workspaceRoutes);

// Apply auth session + multi-tenant isolation guard to all administrative data modules
app.use('/api/inventory', protect, workspaceProtect, inventoryRoutes);
app.use('/api/menu', protect, workspaceProtect, menuRoutes);
app.use('/api/orders', protect, workspaceProtect, orderRoutes);
app.use('/api/customers', protect, workspaceProtect, customerRoutes);
app.use('/api/users', protect, workspaceProtect, userRoutes);
app.use('/api/suppliers', protect, workspaceProtect, supplierRoutes);
app.use('/api/expenses', protect, workspaceProtect, expenseRoutes);
app.use('/api/staff', protect, workspaceProtect, staffRoutes);
app.use('/api/waste', protect, workspaceProtect, wasteRoutes);
app.use('/api/feedback', protect, workspaceProtect, feedbackRoutes);
app.use('/api/reports', protect, workspaceProtect, reportRoutes);

// Socket.io handlers
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Export app for serverless platforms like Vercel
export default app;

const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
