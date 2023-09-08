import express from 'express';
import { user as userModel, url as urlModel } from '../database/schema.js';
import crypto from 'crypto';

const urlRoute = express.Router();


/*
    1. This endpoint is shorten a long URL
    2. Check whether the URL has already been shortened
    3. If not generate short url using using crypto module  and send shortened url as response
    4. If link already shortened send response 
    
*/


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
    
    res.json({ message: 'shortened', data: {...insertData,shortUrl:shortUrl}});


})

/*
    1. This endpoint is to verify the short url
    2. get the key from path params and compare it with database
    3. if short url is valid then redirect to the long url
    4. if short url is not valid the send response 
    
*/


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

/*
    1. This endpoint is to fetch the list of shortened URLs
    2. Fetches the list of shortened urls and send as response
*/


urlRoute.post('/fetch', async (req, res) => {
    const { userId } = req.body;
    const url = await urlModel.find({ userId: userId }, { __v: 0, _id: 0 });
    res.status(200).json({ "message": "found", 'urlData': url });
});


export default urlRoute;