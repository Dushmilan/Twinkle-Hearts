# Redis Guide for Twinkle-Hearts

## What is Redis?

Redis (Remote Dictionary Server) is an **in-memory data structure store** used as:
- **Database** - Fast key-value storage
- **Cache** - Temporary data storage for quick access
- **Message Broker** - Pub/sub messaging

## Why Redis for This Project?

| Use Case | Implementation | TTL |
|----------|---------------|-----|
| User Sessions | Store active login sessions | 7 days |
| User Profile Cache | Cache frequently accessed user data | 1 hour |
| Product Catalog | Cache product lists | 30 minutes |
| Rate Limiting | Track API request counts | 15 minutes |
| Shopping Cart | Temporary cart storage | 24 hours |

## Redis in This Project

### Cache Key Structure
```
session:{sessionId}     → User session data
user:{userId}           → User profile
user:orders:{userId}    → Recent orders
user:wishlist:{userId}  → Wishlist items
products:featured       → Featured products
products:catalog        → All products list
admin:stats             → Dashboard statistics
otp:{phone}             → OTP codes (5 min expiry)
```

## Getting Started

### 1. Start Redis with Docker

```bash
# Start all services (including Redis)
docker-compose up -d

# Check Redis status
docker-compose ps redis

# View Redis logs
docker-compose logs -f redis
```

### 2. Access Redis

**Option A: Redis CLI (Command Line)**
```bash
# Connect to Redis
docker exec -it twinkle-hearts-redis redis-cli

# Test connection
PING
# Response: PONG

# View all keys
KEYS *

# View specific key
GET session:abc123

# Delete a key
DEL session:abc123

# Clear all keys (DANGER!)
FLUSHALL

# Monitor Redis in real-time
MONITOR

# Exit
EXIT
```

**Option B: Redis Commander (Web GUI)**
1. Open http://localhost:8081
2. Login: `admin` / `admin`
3. Browse keys visually

### 3. Common Redis Commands

```bash
# String operations
SET key value
GET key
DEL key
EXPIRE key seconds  # Set TTL

# Hash operations (for objects)
HSET user:1 name "John"
HGET user:1 name
HGETALL user:1

# List operations
LPUSH mylist item1
RPUSH mylist item2
LRANGE mylist 0 -1

# Set operations
SADD myset item1
SISMEMBER myset item1

# Pub/Sub (for real-time features)
SUBSCRIBE channel
PUBLISH channel "message"
```

### 4. Redis in Code (Backend)

```typescript
// src/lib/redis.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Set with expiry (TTL)
await redis.set('user:123', JSON.stringify(userData), 'EX', 3600);

// Get
const user = await redis.get('user:123');

// Delete
await redis.del('user:123');

// Check if key exists
const exists = await redis.exists('user:123');
```

### 5. Cache Patterns Used

**Cache-Aside (Lazy Loading)**
```typescript
async function getUser(userId: string) {
  // 1. Try cache first
  const cached = await redis.get(`user:${userId}`);
  if (cached) return JSON.parse(cached);
  
  // 2. Cache miss - fetch from DB
  const user = await db.user.findUnique({ where: { id: userId } });
  
  // 3. Store in cache (1 hour TTL)
  await redis.setex(`user:${userId}`, 3600, JSON.stringify(user));
  
  return user;
}
```

**Write-Through**
```typescript
async function updateUser(userId: string, data: any) {
  // 1. Update DB
  const user = await db.user.update({ where: { id: userId }, data });
  
  // 2. Update cache
  await redis.setex(`user:${userId}`, 3600, JSON.stringify(user));
  
  return user;
}
```

**Cache Invalidation**
```typescript
// Invalidate cache on update/delete
async function deleteUser(userId: string) {
  await db.user.delete({ where: { id: userId } });
  await redis.del(`user:${userId}`);
  await redis.del(`user:orders:${userId}`);
}
```

## Monitoring Redis

### Check Memory Usage
```bash
docker exec twinkle-hearts-redis redis-cli INFO memory
```

### Check Stats
```bash
docker exec twinkle-hearts-redis redis-cli INFO stats
```

### Slow Log
```bash
docker exec twinkle-hearts-redis redis-cli SLOWLOG GET 10
```

## Production Considerations

### Security
```conf
# redis.conf (production)
requirepass YourStrongPassword123!
bind 127.0.0.1
protected-mode yes
```

### Persistence
- **RDB** - Snapshot at intervals (default)
- **AOF** - Append-only file (enabled in our config)

### Scaling
- **Redis Cluster** - For horizontal scaling
- **Redis Sentinel** - For high availability

## Troubleshooting

### Redis Won't Start
```bash
# Check logs
docker-compose logs redis

# Check if port is in use
netstat -ano | findstr :6379
```

### Connection Refused
```bash
# Verify Redis is running
docker-compose ps redis

# Test connection
docker exec twinkle-hearts-redis redis-cli ping
```

### Memory Full
```bash
# Check memory
docker exec twinkle-hearts-redis redis-cli INFO memory

# Clear expired keys
docker exec twinkle-hearts-redis redis-cli MEMORY PURGE
```

## Useful Links

- [Redis Documentation](https://redis.io/docs/)
- [Redis Commands](https://redis.io/commands/)
- [ioredis (Node.js client)](https://github.com/luin/ioredis)

---

**© 2026 Twinkle-Hearts. All Rights Reserved.**
