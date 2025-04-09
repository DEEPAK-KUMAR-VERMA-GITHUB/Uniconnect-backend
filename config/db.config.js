import mongoose from "mongoose";
import 'dotenv/config'

const initializeDB = async () => {
  try {
    const connectionRef = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(
      `✅ Uniconnect MongoDB Database is Connected: ${connectionRef.connection.host}`
    );

    mongoose.connection.on("error", (err) => {
      console.log("❌ MongoDB connection error : ", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("✂️ MongoDB disconnected");
    });

    return connectionRef;
  } catch (error) {
    console.log(`❌ Error in Uniconnect MongoDB database: ${error.message}`);
    process.exit(1);
  }
};

export default initializeDB;
