const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config(); // Load environment variables

const app = express();
const port = 5000;
const secretKey = process.env.JWT_SECRET || "your_secret_key"; // Use .env for security

// Middleware
app.use(express.json()); // Parse JSON requests
app.use(cors({
  origin: ["http://localhost:5173", "https://your-frontend-url.com"], credentials: true
}));
 // Enable CORS

// MongoDB Connection
const mongourl = process.env.MONGO_URI || "mongodb+srv://kiruthika24:kiruthika@cluster0.ipdec.mongodb.net/zepto";
mongoose
  .connect(mongourl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("✅ Database connected successfully to:", mongourl);
    app.listen(port, () => {
      console.log(`🚀 Server is running at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
  });

// User Schema
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { versionKey: false }
);
const User = mongoose.model("User", userSchema);

// Order Schema
const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [{ name: String, quantity: Number, price: Number }],
    totalAmount: { type: Number, required: true },
  },
  { versionKey: false }
);
const Order = mongoose.model("Order", orderSchema, "zeptocs"); // Force collection name

// ✅ Signup Route
app.post("/api/signup", async (req, res) => {
  console.log("🔹 Signup Request Body:", req.body); // Debugging

  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();
    console.log("✅ User saved to MongoDB:", newUser);

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("❌ Error signing up:", error.message);
    res.status(500).json({ message: "Error in signup" });
  }
});

// ✅ Login Route
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user._id, email: user.email }, secretKey, { expiresIn: "1h" });
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error("❌ Error logging in:", error.message);
    res.status(500).json({ message: "Error in login" });
  }
});

// ✅ Place Order Route
app.post("/api/order", async (req, res) => {
  try {
    console.log("🔹 Order Request Body:", req.body);
    const { userId, items, totalAmount } = req.body;
    if (!userId || !items.length || !totalAmount) {
      return res.status(400).json({ message: "Incomplete order details" });
    }

    const newOrder = new Order({ userId, items, totalAmount });
    await newOrder.save();
    console.log("✅ Order saved to MongoDB (zeptocs collection):", newOrder);

    res.status(201).json({ message: "Order placed successfully" });
  } catch (error) {
    console.error("❌ Error placing order:", error.message);
    res.status(500).json({ message: "Error in order processing" });
  }
});

// ✅ Protected Route Example
app.get("/api/protected", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1]; // Extract token
  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    res.status(200).json({ message: "Access granted", user: decoded });
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
});