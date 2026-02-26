import mongoose from "mongoose";
export const connectDB = async () => {
  try {
      const connec = await mongoose.connect(process.env.MONGO_URL as string);
      console.log(`MongoDB Connected: ${connec.connection.host}`);  
  } catch (error) {
      console.log(`Error : ${(error as Error).message}`);
      process.exit(1);
  }
}

