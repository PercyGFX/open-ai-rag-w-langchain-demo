import express from "express";
import { chat } from "./controllers/chat.controller.js";
const app = express();

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("helloo");
});

app.post("/chat", chat);

const port = process.env.PORT || 5000; // Default to port 3000 if PORT environment variable is not set

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
