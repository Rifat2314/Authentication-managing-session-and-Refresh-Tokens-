const {Schema,model, default: mongoose} = require("mongoose");

const sessionSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref:"hellousers",
    required: true,
  },
  refreshTokenHash: {
    type: String,
    required: true,
    unique:true,
  },
  ip: {
    type: String,
    required: true,
  },
  userAgent: {
    type: String,
    required: true,
  },
  revoked: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const sessionModel = model("sessions", sessionSchema)

module.exports = sessionModel