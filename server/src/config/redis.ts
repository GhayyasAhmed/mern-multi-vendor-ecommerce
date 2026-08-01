import {Redis} from "ioredis";
import "dotenv/config";

const redisClient = () => {
    if(process.env.REDIS_URL){
        console.log(`Redis connected`)
        return process.env.REDIS_URL
    }
    throw new Error('Redix connection failed')
}

export const redis = new Redis(redisClient())
