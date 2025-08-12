require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const cors = require('cors');
app.use(bodyParser.json());

// Import Sequelize configuration and models
const { testConnection } = require('./config/database');
const { syncDatabase } = require('./models');

// Connect to the database
async function initializeDatabase() {
  try {
    await testConnection();
    await syncDatabase();
    console.log('Database initialized successfully with Sequelize!');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

initializeDatabase();

// URLs and application configurations 
if (!process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL = 'http://localhost:8081';
}
if (!process.env.BACKEND_URL) {
  process.env.BACKEND_URL = 'http://localhost:3001';
}

// Configure CORS with proper options
const corsOptions = {
  origin: ['http://localhost:8081', 'http://127.0.0.1:8081'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin', 
    'X-Requested-With', 
    'Content-Type', 
    'Accept', 
    'Authorization',
    'Cache-Control', 
    'Pragma',
    'Expires'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const userRoutes = require("./routes/user");
app.use("/api/users", userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'SocialNetwork API is running',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`SocialNetwork API running on port ${PORT}!`));


