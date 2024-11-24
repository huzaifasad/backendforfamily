const express = require("express");
const stripe = require("stripe")("sk_test_51QOLGFKde6Oq6KbScHw6Aw0asgYNkLuuWGG7tOjxzeM3JykCOdUGkPqWi3WgoZY5alBzBt2wjSygNuAN001a43NM00FP2YbS09"); // Stripe Secret Key
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/auth"); // Middleware for authentication

// Route to create a Stripe Checkout Session
router.post("/create-checkout-session", auth(["parent"]), async (req, res) => {
  const { priceId } = req.body;
  console.log("Received request to create checkout session.");
  console.log("Price ID received:", priceId);

  try {
    const userId = req.user.id;
    console.log("User ID from auth middleware:", userId);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: userId.toString(),
      },
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
    });

    console.log("Stripe Checkout session created successfully:", session.id);
    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error("Error creating Stripe Checkout session:", error.message);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// Route to fetch session details
router.get("/session/:sessionId", auth(["parent"]), async (req, res) => {
    const { sessionId } = req.params;
    console.log("Received request to fetch session details for session ID:", sessionId);
  
    try {
      // Fetch session details from Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      console.log("Stripe session details retrieved:", session);
  
      // Fetch subscription details using the session
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      console.log("Stripe subscription details retrieved:", subscription);
  
      // Update the user's subscription in the database
      const userId = session.metadata.userId;
      await User.findByIdAndUpdate(userId, {
        subscriptionStatus: "active",
        subscriptionExpiry: new Date(subscription.current_period_end * 1000), // Convert Unix timestamp
        subscriptionPlan: subscription.items.data[0].plan.nickname || "unknown", // Use plan nickname or fallback
      });
  
      console.log("User subscription updated successfully for user ID:", userId);
  
      // Return subscription details to the client
      res.status(200).json({
        success: true,
        subscription: {
          plan: subscription.items.data[0].plan.nickname,
          expiry: new Date(subscription.current_period_end * 1000),
        },
      });
    } catch (error) {
      console.error("Error fetching session details or updating user subscription:", error.message);
      res.status(500).json({ success: false, error: "Failed to fetch session details or update subscription" });
    }
  });
  
// Webhook route to handle Stripe events
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    console.log("Webhook endpoint hit.");
    
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
    let event;
  
    try {
      console.log("Verifying webhook signature...");
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      console.log("Webhook verified successfully. Event type:", event.type);
    } catch (err) {
      console.error("Webhook verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  
    if (event.type === "checkout.session.completed") {
      console.log("Handling 'checkout.session.completed' event...");
      const session = event.data.object;
      console.log("Session data received:", session);
  
      const userId = session.metadata.userId; // Retrieve the user ID from session metadata
      console.log("User ID from session metadata:", userId);
  
      try {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        console.log("Subscription data retrieved:", subscription);
  
        // Update the user's subscription status in the database
        await User.findByIdAndUpdate(userId, {
          subscriptionStatus: "active",
          subscriptionExpiry: new Date(subscription.current_period_end * 1000), // Convert Unix timestamp to JavaScript Date
          subscriptionPlan: subscription.items.data[0].plan.nickname || "unknown", // Plan nickname or fallback
        });
  
        console.log("User subscription updated successfully in the database.");
      } catch (err) {
        console.error("Error updating user subscription:", err.message);
      }
    } else {
      console.log(`Unhandled event type: ${event.type}`);
    }
  
    res.status(200).send("Webhook handled successfully");
  });
  

module.exports = router;
