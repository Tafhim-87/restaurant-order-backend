const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const PaymentDB = require("../model/payment.schema"); // Adjust path as needed

dotenv.config();

const router = express.Router();


const JWT_SECRET = process.env.JWT_SECRET_KEY;

// Store timeout references for cleanup
const cleanupTimeouts = new Map();

// Function to schedule automatic deletion
const scheduleAutoDeletion = async (paymentId) => {
  try {
    // Set deletion time to 24 hours from now
    const deletionTime = new Date(Date.now() +  24 * 60 * 60 * 1000); 
    await PaymentDB.findByIdAndUpdate(paymentId, { deletionTime });

    const timeout = setTimeout(async () => {
      try {
        await PaymentDB.findByIdAndDelete(paymentId);
        console.log(`Payment ${paymentId} automatically deleted after 24 hours.`);
        cleanupTimeouts.delete(paymentId);
      } catch (error) {
        console.error("Error in auto-deletion:", error);
        cleanupTimeouts.delete(paymentId);
      }
    },  24 * 60 * 60 * 1000); // 24 hours in milliseconds

    cleanupTimeouts.set(paymentId, timeout);
  } catch (error) {
    console.error("Error scheduling auto-deletion:", error);
  }
};

// Cancel scheduled deletion
const cancelAutoDeletion = (paymentId) => {
  if (cleanupTimeouts.has(paymentId)) {
    clearTimeout(cleanupTimeouts.get(paymentId));
    cleanupTimeouts.delete(paymentId);
  }
};

// Check for overdue deletions on server start or periodically
const checkOverdueDeletions = async () => {
  try {
    const overduePayments = await PaymentDB.find({
      deletionTime: { $lte: new Date() },
    });

    for (const payment of overduePayments) {
      await PaymentDB.findByIdAndDelete(payment._id);
      console.log(`Overdue payment ${payment._id} deleted.`);
      cancelAutoDeletion(payment._id);
    }
  } catch (error) {
    console.error("Error checking overdue deletions:", error);
  }
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// Run overdue deletion check every 5 minutes
setInterval(checkOverdueDeletions, 5 * 60 * 1000);

// Run once on server start
checkOverdueDeletions();

router.get("/", authenticateToken, async (req, res) => {
  try {
    const payments = await PaymentDB.find();
    res.status(200).json(payments);   // <-- return array directly
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


router.post("/process", async (req, res) => {
  console.log("Processing payment with data:", req.body);
  try {
    const { tableNo, method, amount } = req.body;

    if (!tableNo || !method || !amount) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newPayment = new PaymentDB({
      tableNo,
      method,
      amount,
      deletionTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    await newPayment.save();

    // Schedule automatic deletion
    await scheduleAutoDeletion(newPayment._id);

    res.status(201).json({
      message: "Payment processed successfully. Will be automatically deleted in 24 hours.",
      payment: newPayment,
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({ message: "Failed to process payment", error: error.message });
  }
});

// Manual deletion endpoint for a single payment
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const payment = await PaymentDB.findById(id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Cancel the scheduled auto-deletion
    cancelAutoDeletion(id);

    await PaymentDB.findByIdAndDelete(id);
    res.status(200).json({ message: "Payment deleted successfully" });
  } catch (error) {
    console.error("Error deleting payment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// New endpoint to delete all payments
router.delete("/", async (req, res) => {
  try {
    // Clear all scheduled deletions
    cleanupTimeouts.forEach((timeout, paymentId) => {
      clearTimeout(timeout);
      cleanupTimeouts.delete(paymentId);
    });

    // Delete all payments from the database
    await PaymentDB.deleteMany({});
    res.status(200).json({ message: "All payments deleted successfully" });
  } catch (error) {
    console.error("Error deleting all payments:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Endpoint to get all scheduled deletions
router.get("/scheduled", async (req, res) => {
  try {
    const payments = await PaymentDB.find({ deletionTime: { $exists: true } });
    const scheduledDeletions = payments.map((payment) => {
      const secondsRemaining = Math.max(
        0,
        Math.ceil((payment.deletionTime - Date.now()) / 1000)
      );
      const hoursRemaining = (secondsRemaining / 3600).toFixed(4);
      const minutesRemaining = (secondsRemaining / 60).toFixed(2);

      return {
        paymentId: payment._id,
        secondsRemaining,
        hoursRemaining: parseFloat(hoursRemaining),
        minutesRemaining: parseFloat(minutesRemaining),
        willBeDeletedIn:
          secondsRemaining > 3600
            ? `${hoursRemaining} hours`
            : secondsRemaining > 60
            ? `${minutesRemaining} minutes`
            : `${secondsRemaining} seconds`,
        deletionTime: payment.deletionTime.toISOString(),
      };
    });

    res.status(200).json({
      scheduledDeletions,
      count: scheduledDeletions.length,
      summary: `${scheduledDeletions.length} payments scheduled for automatic deletion`,
    });
  } catch (error) {
    console.error("Error fetching scheduled deletions:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;