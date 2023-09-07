import express from 'express';
import cors from 'cors';
import connection from './database/connection.js'


import userRoute from './routes/UserRoute.js'
import urlRoute from './routes/UrlRoute.js'

const app = express();
const PORT = process.env.PORT || 3000;

await connection();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', userRoute);
app.use('/url', urlRoute);


app.listen(PORT, () => {
    console.log('listening on port ' + PORT);
});