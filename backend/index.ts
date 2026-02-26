// Create a simple server
import dns from "dns";
dns.setDefaultResultOrder("ipv4first");
import express, { type Application, type Request, type Response } from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import dotenv from "dotenv";
import cors from "cors";
import { err } from "inngest/types";
import mongoose from "mongoose";

dotenv.config();



const app: Application = express();
const PORT: number = Number(process.env.PORT) || 5001;

// Middlewares
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// log https request to console
if(process.env.NODE_ENV === 'development')
{
  app.use(morgan("dev"));
}

// Routes
app.get("/home", (req: Request, res: Response) => {
  res.send("Bun server running 🚀");
});

// cors-origin resource sharing (Cors) middleware
// credentials : true is allows cookies to be sent with request
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true, 
  })
);

// health check route 
app.get("/api/health", (req: Request, res: Response) => {
  res.status(200).json({status: "OK", message: "Server is healthy! "});
});

// global error handler middleware
app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.log(err.stack);
  res.status(500).json({status: "Error", message: err.message});
});

// Db connections
const connectDB = async () => {
  try {
      const connec = await mongoose.connect(process.env.MONGO_URL as string);
      console.log(`MongoDB Connected: ${connec.connection.host}`);  
  } catch (error) {
      console.log(`Error : ${(error as Error).message}`);
      process.exit(1);
  }
}

// Start server
app.listen(PORT, () => {
  connectDB()
  console.log(`server is running at http://localhost:${PORT}`);
});
