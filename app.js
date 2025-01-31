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

// Product Schema
const productSchema = new mongoose.Schema({
  id: Number,
  name: String,
  price: Number,
  image: String,
});
const Product = mongoose.model("products", productSchema);

// Preload product data
const products = [
  { id: 1, name: "DairyMilk", price: 80, image: "https://neelamfoodlandmumbai.com/cdn/shop/products/IMG_8871_b1d52ae2-802f-4f7b-a6b0-d1b28c49480b_800x.jpg?v=1674132352" },
  { id: 2, name: "KinderJoy (Harry Potter edition)", price: 50, image: "https://rukminim2.flixcart.com/image/720/864/xif0q/chocolate/m/s/f/-original-imah4gpxmhf6hg7h.jpeg?q=60&crop=false" },
  { id: 3, name: "Milk Packet", price: 24, image: "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/assets/products/sliding_images/jpeg/5ee4441d-9109-48fa-9343-f5ce82b905a6.jpg?ts=1706182143" },
  { id: 4, name: "Whole Wheat Bread", price: 40, image: "https://5.imimg.com/data5/HH/HD/IE/SELLER-2726350/whole-wheat-bread.jpeg" },
  { id: 5, name: "Tropicana Delight", price: 70, image: "https://m.media-amazon.com/images/I/71ZNcuBUV5L.jpg" },
  { id: 6, name: "Tomatoes (1 kg)", price: 30, image: "https://upload.wikimedia.org/wikipedia/commons/8/89/Tomato_je.jpg" },
  { id: 7, name: "Carrots (1 kg)", price: 45, image: "https://rukminim2.flixcart.com/image/850/1000/kt7jv680/vegetable/n/l/g/250-carrot-un-branded-no-whole-original-imag6hqkxx6znyhe.jpeg?q=90&crop=false" },
  { id: 8, name: "Soap", price: 15, image: "https://rukminim2.flixcart.com/image/850/1000/jyg5lzk0/soap/q/g/9/5-375-oil-clear-glow-soap-bar-75-gms-pack-of-5-pears-original-imafhmwfhus6hnzf.jpeg?q=20&crop=false" },
  { id: 9, name: "Paneer (Cottage Cheese)", price: 120, image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRa3Z0vkwv41ltM4UIuMLhFxHaqn98rpZl0jg" },
  { id: 10, name: "Eggs (Dozen)", price: 90, image: "https://m.media-amazon.com/images/I/411IYeXfFxL._AC_UF894,1000_QL80_.jpg" },
];
Product.insertMany(products).catch(() => {});

// Order Schema
const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  items: [{ productId: Number, name: String, price: Number, quantity: Number }],
  totalAmount: { type: Number, required: true },
}, { timestamps: true });
const Order = mongoose.model("orders", orderSchema);

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
