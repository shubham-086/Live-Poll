const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [process.env.CLIENT_URL],
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.send("Server is Healthy.");
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/Live-Poll")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// Poll Schema
const questionSchema = new mongoose.Schema({
  text: String,
  options: [
    {
      text: String,
      votes: { type: Number, default: 0 },
    },
  ],
});

const pollSchema = new mongoose.Schema({
  title: String,
  questions: [questionSchema],
  createdAt: { type: Date, default: Date.now },
});

const Poll = mongoose.model("Poll", pollSchema);

// Routes
app.post("/api/polls", async (req, res) => {
  try {
    console.log(req.body);
    const poll = new Poll({
      title: req.body.title,
      questions: req.body.questions.map((q) => ({
        text: q.text,
        options: q.options.map((opt) => ({ text: opt })),
      })),
    });
    await poll.save();
    res.status(201).send(poll);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

app.get("/api/polls", async (req, res) => {
  try {
    const polls = await Poll.find().sort({ createdAt: -1 });
    res.send(
      polls.map((poll) => ({
        _id: poll._id,
        title: poll.title,
        questions: poll.questions,
        createdAt: poll.createdAt,
      }))
    );
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get("/api/polls/:id", async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).send();
    res.send(poll);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.post("/api/polls/:id/vote", async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll || !poll.isActive) return res.status(404).send();

    // Check if user has already voted (simple IP-based check for demo)
    const voterIp = req.ip;
    const hasVoted = req.body.votes.some((v) =>
      poll.questions[v.questionIndex].options[v.optionIndex].voterIps?.includes(voterIp)
    );

    if (hasVoted) {
      return res.status(400).send({ error: "You have already voted in this poll" });
    }

    // Process each vote
    req.body.votes.forEach((vote) => {
      const question = poll.questions[vote.questionIndex];
      const option = question.options[vote.optionIndex];
      option.votes += 1;

      // Track voter IP (for simple duplicate prevention)
      if (!option.voterIps) option.voterIps = [];
      option.voterIps.push(voterIp);
    });

    await poll.save();

    // Emit update to all clients
    io.emit("pollUpdate", poll);
    res.send(poll);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Socket.io for real-time updates
io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("joinPoll", (pollId) => {
    socket.join(pollId);
  });

  socket.on("disconnect", () => console.log("Client disconnected"));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
