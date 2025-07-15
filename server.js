
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const doctorRoutes = require("./routes/doctorRoutes");
const franchiseRoutes = require("./routes/franchiseRoutes")
const pathologyRoutes = require("./routes/pathologyRoutes")
const healthagentRoutes = require("./routes/healthagentRoutes")
const hospitalRoutes = require("./routes/hospitalRoutes")
const labRoutes = require("./routes/labRoutes")


const app = express();
app.use(express.json());
app.use(cors());

app.use(cors({
  origin: ['https://www.aayushwellness.com'], // Allow your frontend domain
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// **MongoDB Connection**
const db = async()=>{
  try{
    mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.error("MongoDB Connection Error:", err));
  }
  catch(e){
    console.log(e)
  }
}
db();



// **Routes**
app.use("/api/doctors", doctorRoutes);
app.use("/api/franchise", franchiseRoutes);
app.use("/api/pathology", pathologyRoutes);
app.use("/api/healthagent", healthagentRoutes);
app.use("/api/hospital" , hospitalRoutes);
app.use("/api/lab" , labRoutes);

// **Start the Server**
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
