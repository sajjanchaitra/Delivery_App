const express = require("express");
const Store = require("../models/Store");
const { auth, isVendor } = require("../middleware/auth");

const router = express.Router();

// POST /api/stores - Create store
router.post("/", auth, isVendor, async (req, res) => {
  try {
    let store = await Store.findOne({ vendor: req.userId });

    if (store) {
      store = await Store.findOneAndUpdate({ vendor: req.userId }, req.body, { new: true });
    } else {
      store = new Store({ ...req.body, vendor: req.userId });
      await store.save();
    }

    res.json({ success: true, store });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stores - Get all stores
router.get("/", async (req, res) => {
  try {
    const stores = await Store.find({ isActive: true });
    res.json({ success: true, stores });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stores/my-store - Get vendor's store
router.get("/my-store", auth, isVendor, async (req, res) => {
  try {
    const store = await Store.findOne({ vendor: req.userId });
    res.json({ success: true, store });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stores/:id
router.get("/:id", async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    res.json({ success: true, store });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/stores/status
router.patch("/status", auth, isVendor, async (req, res) => {
  try {
    const store = await Store.findOneAndUpdate(
      { vendor: req.userId },
      { isOpen: req.body.isOpen },
      { new: true }
    );
    res.json({ success: true, store });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;