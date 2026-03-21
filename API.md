# API Documentation - Twinkle-Hearts E-commerce

Base URL: `http://localhost:3001`

## Health Check

### GET /health
Check API health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-21T12:00:00.000Z"
}
```

---

## Products API

### GET /api/products
List all active products with pagination.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Items per page
- `search` (string, optional) - Search by name/description
- `category` (string, optional) - Filter by category

**Response:**
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Classic Heart Necklace",
      "description": "Elegant heart-shaped pendant...",
      "price": 2999,
      "stock": 50,
      "sku": "THN-001",
      "category": "Necklaces",
      "images": ["/images/product-1.jpg"],
      "createdAt": "2026-03-21T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### GET /api/products/:id
Get single product by ID.

**Response:**
```json
{
  "product": {
    "id": "uuid",
    "name": "Classic Heart Necklace",
    "description": "Elegant heart-shaped pendant...",
    "price": 2999,
    "stock": 50,
    "sku": "THN-001",
    "category": "Necklaces",
    "images": ["/images/product-1.jpg", "/images/product-2.jpg"],
    "isActive": true,
    "createdAt": "2026-03-21T12:00:00.000Z"
  }
}
```

**Errors:**
- `404` - Product not found

### GET /api/products/search
Search products by query.

**Query Parameters:**
- `q` (string, required, min: 2 characters) - Search query

**Response:**
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Classic Heart Necklace",
      "price": 2999,
      "images": ["/images/product-1.jpg"]
    }
  ]
}
```

---

## Cart API

### POST /api/cart/sync
Sync cart with backend - validates products and returns current prices.

**Request Body:**
```json
{
  "items": [
    {
      "productId": "uuid",
      "quantity": 2,
      "price": 2999
    }
  ]
}
```

**Response:**
```json
{
  "items": [
    {
      "productId": "uuid",
      "quantity": 2,
      "currentPrice": 2999,
      "productName": "Classic Heart Necklace",
      "stockAvailable": 50,
      "inStock": true
    }
  ],
  "syncedAt": "2026-03-21T12:00:00.000Z"
}
```

**Errors:**
- `400` - Invalid cart structure or empty cart

---

## Orders API

### POST /api/orders/create
Create a new order from cart.

**Rate Limit:** 5 requests per 15 minutes

**Request Body:**
```json
{
  "items": [
    {
      "productId": "uuid",
      "quantity": 2,
      "price": 2999
    }
  ],
  "customerName": "John Doe",
  "customerPhone": "+919876543210"
}
```

**Response:**
```json
{
  "orderId": "uuid",
  "status": "PENDING_WHATSAPP_CONFIRMATION",
  "items": [
    {
      "productId": "uuid",
      "productName": "Classic Heart Necklace",
      "quantity": 2,
      "price": 2999
    }
  ],
  "subtotal": 5998,
  "tax": 1079.64,
  "total": 7077.64,
  "whatsappDeepLink": "https://wa.me/919876543210?text=...",
  "expiresAt": "2026-03-21T12:15:00.000Z",
  "createdAt": "2026-03-21T12:00:00.000Z"
}
```

**Errors:**
- `400` - Invalid input, product not found, or stock unavailable
- `429` - Too many order attempts

### GET /api/orders/:id
Get order by ID.

**Response:**
```json
{
  "order": {
    "id": "uuid",
    "status": "PENDING_WHATSAPP_CONFIRMATION",
    "total": 7077.64,
    "items": [
      {
        "productId": "uuid",
        "productName": "Classic Heart Necklace",
        "quantity": 2,
        "price": 2999
      }
    ],
    "customerName": "John Doe",
    "createdAt": "2026-03-21T12:00:00.000Z",
    "confirmedAt": null
  }
}
```

**Errors:**
- `404` - Order not found

### POST /api/orders/:id/confirm
Confirm order after WhatsApp verification.

**Request Body:**
```json
{
  "whatsappMessageId": "wamid.HBgN..."
}
```

**Response:**
```json
{
  "order": {
    "id": "uuid",
    "status": "CONFIRMED",
    "total": 7077.64,
    "confirmedAt": "2026-03-21T12:05:00.000Z"
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

For stock errors:
```json
{
  "error": "Stock unavailable",
  "details": {
    "productId": "uuid",
    "available": 5,
    "requested": 10
  }
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (invalid input, validation error) |
| 404 | Not Found |
| 409 | Conflict (duplicate order, etc.) |
| 429 | Too Many Requests (rate limit exceeded) |
| 500 | Internal Server Error |

---

## Rate Limiting

- **General API:** 100 requests per 15 minutes
- **Order Creation:** 5 orders per 15 minutes

Rate limit headers are included in all responses:
- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Requests remaining
- `X-RateLimit-Reset` - Time when limit resets

---

**© 2026 Twinkle-Hearts. All Rights Reserved.**
**Private Commercial Project - Confidential**
