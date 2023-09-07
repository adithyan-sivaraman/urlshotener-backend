import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    userId:{
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    lname: {
        type: String,
        required: true,
    },
    fname: {
        type: String,
        required: true,
    },
    active:{
        type: Boolean,
        required: true,
    },
    token:{
        type: String,
        required: false,
    }
});

const urlSchema = {
    id:{
        type: Number,
        required: true,
    },
    userId:{
        type: String,
        required: true,
    },
    longUrl: {
        type: String,
        required: true,
    },
    shortUrl: {
        type: String,
        required: true,
    },
    visitedCount: {
        type: Number,
        required: false,
    },
    created: {
        type: String,
        required: true,
    },
}

const user = mongoose.model('users', userSchema);
const url = mongoose.model('urls', urlSchema);

export { user,url };