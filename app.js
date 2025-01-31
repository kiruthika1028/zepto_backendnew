
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 5000;
const secretKey = process.env.JWT_SECRET || "your_secret_key";

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB connection
const mongoUrl = process.env.MONGO_URI || "mongodb+srv://kiruthika24:kiruthika@cluster0.ipdec.mongodb.net/zepto";
mongoose
  .connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("✅ Database connected successfully");
    app.listen(port, () => {
      console.log(`🚀 Server is running at port ${port}`);
    });
  })
  .catch((err) => console.log("❌ Database connection failed:", err.message));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.model("users", userSchema);

// Order Schema
const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  items: [{ productId: String, quantity: Number }],
  totalAmount: { type: Number, required: true },
}, { timestamps: true });
const Order = mongoose.model("orders", orderSchema);

// ✅ Signup Route
app.post("/api/signup", async (req, res) => {
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
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error signing up", error: error.message });
  }
});

// ✅ Login Route
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const token = jwt.sign({ userId: user._id, email: user.email }, secretKey, { expiresIn: "1h" });
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ message: "Error in login", error: error.message });
  }
});

// ✅ Place Order
app.post("/api/orders", async (req, res) => {
  try {
    const { userId, items, totalAmount } = req.body;
    if (!userId || !items || totalAmount === undefined) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const newOrder = new Order({ userId, items, totalAmount });
    await newOrder.save();
    res.status(201).json({ message: "Order placed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error placing order", error: error.message });
  }
});

// ✅ Fetch Orders
app.get("/api/orders/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ userId }).populate("userId", "username email");
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders", error: error.message });
  }
});

// ✅ Protected Route
const authorize = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }
  jwt.verify(token, secretKey, (err, userInfo) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.user = userInfo;
    next();
  });
};

app.get("/api/protected", authorize, (req, res) => {
  res.json({ message: "Access granted", user: req.user });
});
