const express = require("express"); // Import express module
const mongoose = require("mongoose"); // Import mongoose for database interaction
const { v4: uuidv4 } = require("uuid"); // Import UUID for unique IDs

const app = express();
const port = 5000; // Port for the backend server

// MongoDB connection string
const mongourl = "mongodb+srv://kiruthika24:kiruthika@cluster0.ipdec.mongodb.net/zepto";

// Connect to MongoDB
mongoose
  .connect(mongourl)
  .then(() => {
    console.log("Database connected successfully");
    app.listen(port, () => {
      console.log(`Server is running at port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err.message);
  });

// Middleware to parse JSON requests
app.use(express.json());

// Define Order Schema and Model
const orderSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
  },
  { versionKey: false } // Disable __v field
);

const orderModel = mongoose.model("zeptoc", orderSchema);

// Get all orders
app.get("/api/orders", async (req, res) => {
  try {
    const orders = await orderModel.find();
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error.message);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

// Create a new order
app.post("/api/orders", async (req, res) => {
  try {
    const { name, price, quantity } = req.body;

    if (!name || !price || !quantity) {
      return res.status(400).json({ message: "All fields (name, price, quantity) are required" });
    }

    const newOrder = new orderModel({
      id: uuidv4(), // Generate a unique ID
      name,
      price,
      quantity,
    });

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error("Error creating order:", error.message);
    res.status(500).json({ message: "Error in creating order" });
  }
});

// Get a specific order by ID
app.get("/api/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const order = await orderModel.findOne({ id });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json(order);
  } catch (error) {
    console.error("Error fetching order:", error.message);
    res.status(500).json({ message: "Error in fetching order" });
  }
});

// Update an existing order by ID
app.put("/api/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("ID passed to PUT:", id);

    const updatedData = req.body;
    if (Object.keys(updatedData).length === 0) {
      return res.status(400).json({ message: "At least one field must be provided to update" });
    }

    const orderExists = await orderModel.findOne({ id });
    if (!orderExists) {
      return res.status(404).json({ message: "Order not found" });
    }

    const updatedOrder = await orderModel.findOneAndUpdate(
      { id },
      { $set: updatedData },
      { new: true }
    );

    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error("Error updating order:", error.message);
    res.status(500).json({ message: "Error in updating order" });
  }
});

// Delete an order by ID
app.delete("/api/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedOrder = await orderModel.findOneAndDelete({ id });
    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json({ message: "Order deleted successfully", deletedOrder });
  } catch (error) {
    console.error("Error deleting order:", error.message);
    res.status(500).json({ message: "Error in deleting order" });
  }
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!", error: err.message });
});
