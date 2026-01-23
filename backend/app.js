const express = require("express");
const cors = require("cors");


const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const rideRoutes = require("./routes/ride.routes");

const app = express();

// app.listen(3000,"0.0.0.0");

app.use(cors());
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/", rideRoutes);

app.get("/", (req, res) => {
  res.send("Ride Sharing Backend Running");
});

module.exports = app;
