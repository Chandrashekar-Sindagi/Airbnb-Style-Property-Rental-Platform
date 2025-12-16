const mongoose = require('mongoose');

// Schema for storing user's favourite homes
const favouriteSchema = mongoose.Schema({
  // Reference to the user who marked this home as favourite
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true  // Index for faster queries
  },
  // Reference to the home that is marked as favourite
  houseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Home',
    required: [true, 'House ID is required'],
    index: true  // Index for faster queries
  },
  // Timestamp when the home was marked as favourite
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create a compound unique index on userId and houseId to prevent duplicate favourites
// This allows multiple users to favourite the same home, but prevents one user from favouriting the same home twice
favouriteSchema.index({ userId: 1, houseId: 1 }, { unique: true });

// mongoose.model creates a model named 'Favourite' using the favouriteSchema structure
module.exports = mongoose.model('Favourite', favouriteSchema);
