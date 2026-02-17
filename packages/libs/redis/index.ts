import Redis from "ioredis";
import {env} from "../configs/env"

const redis = new Redis({
  host: env.redisHost,
  port: env.redisPort,
  password: env.redisPassword,
});

export default redis;