import express from 'express';
import { user as userModel, url as urlModel } from '../database/schema.js';
import crypto from 'crypto';

const urlRoute = express.Router();

urlRoute.post('/shorten', async (req, res) => {

    const { email, longUrl } = req.body;
    const user = await userModel.findOne({ email: email });
    let isUrl = await urlModel.findOne({ longUrl: longUrl,userId:user.userId });
    const nextId = await urlModel.find({}, {}, { sort: { id: -1 } });

    if (isUrl) {
        res.json({ message: 'exists', shortUrl: isUrl.shortUrl });
        return
    }
    const key = crypto.randomBytes(8).toString('hex');
    const shortUrl = `https://urlshotener-backend.onrender.com/url/${key}`
    const createdDt = new Date();
    const insertData = { ...req.body, shortUrl: key, id: nextId.length + 1, userId: user.userId, created: createdDt };
    const url = new urlModel(insertData)
    await url.save();
    // console.log(url)
    res.json({ message: 'shortened', data: {...insertData,shortUrl:shortUrl}});


})

urlRoute.get('/:key', async (req, res) => {
    const { key } = req.params;
    let url = await urlModel.findOne({ shortUrl: key });
    if (url !== null) {
        res.redirect(url.longUrl);
        let count = url.visitedCount ? url.visitedCount + 1 : 1;
        url.visitedCount = count;
        url.save();
        return;
    }
    else {
        res.send("Short Url is not valid")
    }
    


});

urlRoute.post('/fetch', async (req, res) => {
    const { userId } = req.body;
    const url = await urlModel.find({ userId: userId }, { __v: 0, _id: 0 });
    res.status(200).json({ "message": "found", 'urlData': url });
});


export default urlRoute;