const express = require("express");
const router = express.Router();
const Address = require("../models/Address");
const { auth } = require("../middleware/auth"); // ✅ IMPORTANT

// GET all addresses
router.get("/", auth, async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.userId })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    res.json({ success: true, addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ADD new address
router.post("/", auth, async (req, res) => {
  try {
    const payload = req.body;

    const existingCount = await Address.countDocuments({ user: req.userId });

    const newAddress = await Address.create({
      user: req.userId,
      ...payload,
      isDefault: existingCount === 0 ? true : !!payload.isDefault,
    });

    if (newAddress.isDefault) {
      await Address.updateMany(
        { user: req.userId, _id: { $ne: newAddress._id } },
        { $set: { isDefault: false } }
      );
    }

    res.json({ success: true, address: newAddress });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// UPDATE address
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    const updated = await Address.findOneAndUpdate(
      { _id: id, user: req.userId },
      payload,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    if (updated.isDefault) {
      await Address.updateMany(
        { user: req.userId, _id: { $ne: updated._id } },
        { $set: { isDefault: false } }
      );
    }

    res.json({ success: true, address: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE address
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Address.findOneAndDelete({ _id: id, user: req.userId });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    if (deleted.isDefault) {
      const latest = await Address.findOne({ user: req.userId }).sort({ createdAt: -1 });
      if (latest) {
        latest.isDefault = true;
        await latest.save();
      }
    }

    res.json({ success: true, message: "Address deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// SET DEFAULT
router.patch("/:id/default", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const addr = await Address.findOne({ _id: id, user: req.userId });
    if (!addr) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    await Address.updateMany({ user: req.userId }, { $set: { isDefault: false } });
    addr.isDefault = true;
    await addr.save();

    res.json({ success: true, address: addr });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
