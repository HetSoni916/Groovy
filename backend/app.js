const express = require("express");
const cors = require("cors");
const todoRoutes = require("./routes/todoRoutes");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// Health check
app.get("/health", (req, res) => res.json({ status: "OK" }));

// Routes
app.use("/todos", todoRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

module.exports = app;
