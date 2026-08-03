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

// Without this handler, ioredis emits unhandled 'error' events which crash the process
redis.on("error", (err) => {
    console.error("Redis client error:", err)
})