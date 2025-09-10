const express = require('express');
const dotenv = require('dotenv');
const MenuDB = require('../model/menu.schema.js');

dotenv.config();
const router = express.Router();




// POST /menu/upload - Create a new menu item
router.post('/upload', async (req, res) => {
  try {
    const { name, price, category, description, imagepath } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ message: "Name, price, and category are required" });
    }

    const newMenuItem = new MenuDB({
      name,
      price,
      category,
      description: description || "Delicious dish!",
      imagepath: imagepath || "https://example.com/default-image.jpg"
    });

    const savedItem = await newMenuItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
    console.error("Error creating menu item:", error);
    res.status(500).json({ message: "Failed to create menu item", error: error.message });
  }
});

// POST /menu/generate-description - Generate AI description
router.post('/generate-description', async (req, res) => {
  try {
    const { name, category } = req.body;

    if (!name || !category) {
      return res.status(400).json({ message: "Name, price, and category are required" });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Write a short and attractive recipe menu description in less than 50 words for a dish named "${name}". The dish belongs to the "${category}" category.`
                }
              ]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const aiDescription = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Tasty dish!";

    res.status(200).json({ description: aiDescription });
  } catch (error) {
    console.error("Error generating description:", error);
    res.status(500).json({ message: "Failed to generate description", error: error.message });
  }
});

// DELETE /menu/:id - Delete a menu item
router.delete('/:id', async (req, res) => {
  try {
    const menuItem = await MenuDB.findByIdAndDelete(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.status(200).json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    res.status(500).json({ message: 'Failed to delete menu item', error: error.message });
  }
});

// GET /menu - Get all menu items
router.get('/', async (req, res) => {
  try {
    const menuItems = await MenuDB.find();
    res.status(200).json(menuItems);
  } catch (error) {
    console.error("Error fetching menu items:", error);
    res.status(500).json({ message: 'Failed to fetch menu items', error: error.message });
  }
});

module.exports = router;