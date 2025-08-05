import express from 'express';
import cookieParser from "cookie-parser"
import cors from "cors"
import bodyParser from "body-parser"


const App = express()

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://192.168.100.2:5173',        // removed trailing slash
  'http://192.168.100.2:4500',        // removed trailing slash
  'https://chestguard.onrender.com',
  'https://chest-guard.vercel.app',
  'https://chestguard-1.onrender.com',
  'https://chestguard-ai-and-deeplearning.onrender.com',
  'https://chestguard-ai-and-deeplearning-1.onrender.com'
];

App.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  })
);


App.use(bodyParser.json())

App.use(express.urlencoded({ limit: '16kb', extended: true }))

App.use(cookieParser())

import userRouter from './routes/user.route.js';
import askQuestionRouter from './routes/askQuestion.route.js';
import adminRouter from './routes/admin.router.js';
import detectionRouter from './routes/detection.route.js';

App.use("/api/v1/chestguarduser", userRouter)
App.use("/api/v1/chestguardquestion", askQuestionRouter)
App.use("/api/v1/chestguard", adminRouter)
App.use("/api/v1/chestguardDetection", detectionRouter)


export default App
