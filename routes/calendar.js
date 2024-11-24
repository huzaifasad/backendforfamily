const express = require("express");
const { format, startOfWeek, endOfWeek } = require("date-fns");
const Event = require("../models/Event"); // Import Event model
const auth = require("../middleware/auth"); // Middleware for authentication

const router = express.Router();

// 1. **Get All Events for the Logged-in User**
router.get("/", auth(["parent"],true), async (req, res) => {
    console.log("Received GET request to fetch all events for user:", req.user?.id || "No User");
    try {
      const events = await Event.find({ user: req.user.id });
      console.log("Fetched events successfully:", events);
      res.status(200).json(events);
    } catch (error) {
      console.error("Error fetching events:", error.message);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });
  
// 7. **Get Upcoming Events**
router.get("/upcoming", auth(["parent"]), async (req, res) => {
  console.log("Received GET request to fetch upcoming events.");

  const today = new Date(); // Current date and time
  const formattedToday = format(today, "yyyy-MM-dd"); // Format date for comparison

  try {
    const upcomingEvents = await Event.find({
      user: req.user.id,
      date: { $gt: formattedToday }, // Events with a date greater than today
    }).sort({ date: 1, startTime: 1 }); // Sort by date and time

    console.log("Upcoming events fetched successfully:", upcomingEvents);
    res.status(200).json(upcomingEvents);
  } catch (error) {
    console.error("Error fetching upcoming events:", error.message);
    res.status(500).json({ message: "Failed to fetch upcoming events" });
  }
});

// 2. **Add a New Event**
router.post("/", auth(["parent"]), async (req, res) => {
  console.log("Received POST request to add a new event:", req.body);

  const { title, description, date, startTime, endTime, category } = req.body;

  // Validate input
  if (!title || !date || !startTime || !endTime || !category) {
    console.error("Validation failed. Missing required fields.");
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Create a new event
    const newEvent = await Event.create({
      title,
      description,
      date,
      startTime,
      endTime,
      category,
      user: req.user.id,
    });

    console.log("Event added successfully:", newEvent);
    res.status(201).json({ message: "Event added successfully", event: newEvent });
  } catch (error) {
    console.error("Error adding event:", error.message);
    res.status(500).json({ message: "Failed to add event" });
  }
});

// 3. **Update an Event**
router.put("/:id", auth(["parent"]), async (req, res) => {
  console.log("Received PUT request to update event:", req.params.id, req.body);

  try {
    const updatedEvent = await Event.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );

    if (!updatedEvent) {
      console.error("Event not found for update:", req.params.id);
      return res.status(404).json({ message: "Event not found" });
    }

    console.log("Event updated successfully:", updatedEvent);
    res.status(200).json({ message: "Event updated successfully", event: updatedEvent });
  } catch (error) {
    console.error("Error updating event:", error.message);
    res.status(500).json({ message: "Failed to update event" });
  }
});

// 4. **Delete an Event**
router.delete("/:id", auth(["parent"]), async (req, res) => {
  console.log("Received DELETE request to delete event:", req.params.id);

  try {
    const deletedEvent = await Event.findOneAndDelete({ _id: req.params.id, user: req.user.id });

    if (!deletedEvent) {
      console.error("Event not found for deletion:", req.params.id);
      return res.status(404).json({ message: "Event not found" });
    }

    console.log("Event deleted successfully:", deletedEvent);
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error.message);
    res.status(500).json({ message: "Failed to delete event" });
  }
});

// 5. **Get Events for Current Week**
router.get("/week", auth(["parent"]), async (req, res) => {
  console.log("Received GET request to fetch events for the current week.");

  const now = new Date();
  const startOfWeekDate = startOfWeek(now, { weekStartsOn: 0 }); // Week starts on Sunday
  const endOfWeekDate = endOfWeek(now, { weekStartsOn: 0 });

  console.log("Week range:", format(startOfWeekDate, "yyyy-MM-dd"), "-", format(endOfWeekDate, "yyyy-MM-dd"));

  try {
    const events = await Event.find({
      user: req.user.id,
      date: { $gte: format(startOfWeekDate, "yyyy-MM-dd"), $lte: format(endOfWeekDate, "yyyy-MM-dd") },
    });

    console.log("Weekly events fetched successfully:", events);
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching weekly events:", error.message);
    res.status(500).json({ message: "Failed to fetch weekly events" });
  }
});

// 6. **Get Events for Today**
router.get("/today", auth(["parent"]), async (req, res) => {
  console.log("Received GET request to fetch events for today.");

  const today = format(new Date(), "yyyy-MM-dd");
  console.log("Today's date:", today);

  try {
    const events = await Event.find({
      user: req.user.id,
      date: today,
    });

    console.log("Today's events fetched successfully:", events);
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching today's events:", error.message);
    res.status(500).json({ message: "Failed to fetch today's events" });
  }
});

module.exports = router;
