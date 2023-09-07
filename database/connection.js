import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

//required for local mongodb
const dbName = process.env.MONGO_DB
const localDBUrl = process.env.MONGO_URL;

//required for cloud mongodb
const username = process.env.MONGO_USER;
const  password =  process.env.MONGO_PASSWORD;
const clusterName = process.env.MONGO_CLUSTER || '';


const cloudMongoUrl = `mongodb+srv://${username}:${password}@${clusterName}/${dbName}?retryWrites=true&w=majority`;
const localUrl = `${localDBUrl}/${dbName}`;
const connection = async ()=>{
try{
await mongoose.connect(cloudMongoUrl,{
    useNewUrlParser: true,
});
console.log('connection established');
}
catch(error){
    console.log(error);
    process.exit(1);
}
};
export default connection;