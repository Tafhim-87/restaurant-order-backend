
const express = require("express");
const serverless = require("serverless-http");
const connectDB = require("../../data/db.js");
const cors = require("cors");
const dotenv = require("dotenv");
const { Router } = require("express");

const menuRoutes = require("../../menu/router.js");
const paymentsRoutes = require("../../payments/routes.js");
const signInRoutes = require("../../signIn/route.js");

dotenv.config();

const api = express();

api.use(cors());
api.use(express.json());
api.use(express.urlencoded({ extended: true }));

// Connect DB
connectDB();

const router = Router();
router.get("/hello", (req, res) => res.send("Hello World!"));
api.use("/api/", router);

// Mount feature routes
router.use("/menu", menuRoutes);
router.use("/payment", paymentsRoutes);
router.use("/pos", signInRoutes);

// Export for Netlify
module.exports.handler = serverless(api);

