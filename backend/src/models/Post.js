const mongoose = require('mongoose');

const overlaySchema = new mongoose.Schema(
    {
        id: { type: String, required: true },
        type: { type: String, enum: ['sticker', 'doodle', 'image'], required: true },
        src: { type: String },
        text: { type: String },
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 },
        width: { type: Number, default: 100 },
        height: { type: Number, default: 100 },
        rotation: { type: Number, default: 0 },
        opacity: { type: Number, default: 1 },
        zIndex: { type: Number, default: 1 },
    },
    { _id: false }
);

const contentBlockSchema = new mongoose.Schema(
    {
        kind: { type: String, enum: ['heading', 'subheading', 'paragraph'], required: true },
        text: { type: String, default: '' },
        marks: {
            bold: { type: Boolean, default: false },
            italic: { type: Boolean, default: false },
        },
        align: { type: String, enum: ['left', 'center', 'right', 'justify'], default: 'center' },
    },
    { _id: false }
);

const postSchema = new mongoose.Schema(
    {
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        title: { type: String, required: true, trim: true },
        subtitle: { type: String, trim: true },

        vibeColor: { type: String, default: '#ffffff' },
        blogType: { type: String, default: 'post' },
        alignment: { type: String, enum: ['left', 'center', 'right', 'justify'], default: 'center' },

        imageUrl: { type: String },

        contentJson: {
            type: [contentBlockSchema],
            default: [],
        },

        overlays: { type: [overlaySchema], default: [] },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Post', postSchema);

