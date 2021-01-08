"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatSchema = void 0;
const mongoose = require("mongoose");
exports.chatSchema = new mongoose.Schema({
    username: String,
    msg: String,
}, {
    timestamps: true
});
//# sourceMappingURL=chat.schema.js.map