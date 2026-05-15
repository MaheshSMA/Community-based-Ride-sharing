# API Reference - New Endpoints

## Vehicle Details Management

### Save/Update Vehicle Details
```
POST /captain/vehicle-details
```

**Request:**
```javascript
{
  vehicleNumber: "KA-05-AB-1234",
  vehicleColor: "White", 
  vehicleModel: "Toyota Fortuner"
}
```

**Response (Success):**
```javascript
{
  message: "Vehicle details saved successfully",
  vehicleDetails: {
    number: "KA-05-AB-1234",
    color: "White",
    model: "Toyota Fortuner"
  }
}
```

**Response (Error):**
```javascript
{
  message: "All vehicle details are required" // or other error message
}
```

**HTTP Status:**
- 200: Success
- 400: Validation error (missing fields)
- 401: Unauthorized
- 403: Only captains can add vehicle details
- 500: Server error

---

### Get Vehicle Details
```
GET /captain/{captainId}/vehicle-details
```

**Response (Success):**
```javascript
{
  name: "John Doe",
  phone: "+919999999999",
  rating: 4.5,
  vehicleDetails: {
    number: "KA-05-AB-1234",
    color: "White",
    model: "Toyota Fortuner"
  }
}
```

**Response (Empty/New Captain):**
```javascript
{
  name: "John Doe",
  phone: "+919999999999",
  rating: 4,
  vehicleDetails: null
}
```

**HTTP Status:**
- 200: Success
- 404: Captain not found
- 500: Server error

---

## Ride Management

### Get Ride Details
```
GET /rides/{rideId}
```

**Response (Success):**
```javascript
{
  success: true,
  ride: {
    _id: "ride123",
    status: "ACCEPTED",
    pickup: {
      lat: 12.9716,
      lng: 77.5946,
      label: "Bangalore"
    },
    drop: {
      lat: 13.0827,
      lng: 80.2707,
      label: "Chennai"
    },
    route: {
      polyline: "encoded_polyline_string",
      distance: 350000,        // meters
      duration: 18000          // seconds
    },
    matchedRoute: "encoded_polyline_string",
    captainDetails: {
      name: "Captain John",
      phone: "+919999999999",
      rating: 4.5,
      vehicleDetails: {
        number: "KA-05-AB-1234",
        color: "White",
        model: "Toyota Fortuner"
      }
    },
    pointsEarned: 0,
    createdAt: "2024-05-15T10:30:00Z",
    updatedAt: "2024-05-15T10:30:00Z"
  }
}
```

**HTTP Status:**
- 200: Success
- 404: Ride not found
- 500: Server error

---

### Complete Ride
```
POST /rides/{rideId}/complete
```

**Request:**
```javascript
{
  distanceInKm: 35  // Example: 350km ride
}
```

**Response (Success):**
```javascript
{
  success: true,
  message: "Ride completed successfully",
  pointsEarned: 35,  // ceil(35) = 35
  ride: {
    _id: "ride123",
    status: "COMPLETED",
    pointsEarned: 35,
    // ... other ride details
  }
}
```

**Response (Error - Already Completed):**
```javascript
{
  success: false,
  message: "Ride already completed"
}
```

**HTTP Status:**
- 200: Success
- 400: Ride already completed or invalid distance
- 404: Ride not found
- 500: Server error

---

## Points System

### Transfer Points
```
POST /user/transfer-points
```

**Request:**
```javascript
{
  rideId: "ride123",
  captainId: "captain_user_id",
  riderId: "rider_user_id",
  distanceInKm: 35  // Example: 350km = 35 points
}
```

**Response (Success):**
```javascript
{
  success: true,
  message: "Points transferred successfully",
  pointsTransferred: 35,
  captainNewBalance: 135,  // Captain had 100, now 135
  riderNewBalance: 65      // Rider had 100, now 65
}
```

**Response (Error - Already Transferred):**
```javascript
{
  success: false,
  message: "Points already transferred for this ride"
}
```

**Response (Error - Invalid Input):**
```javascript
{
  success: false,
  message: "rideId, captainId, riderId, and distanceInKm are required"
}
```

**HTTP Status:**
- 200: Success
- 400: Missing required fields or already transferred
- 404: Ride, captain, or rider not found
- 500: Server error

**Points Calculation:**
```javascript
pointsToTransfer = Math.ceil(distanceInKm)

Examples:
- 5 km → 5 points
- 5.1 km → 6 points
- 5.9 km → 6 points
- 10 km → 10 points
```

**Constraints:**
- Rider points cannot go below 0 (capped at 0)
- Captain points have no upper limit
- Points are only transferred once per ride

---

## User Profile

### Get User Details
```
GET /user/{userId}
```

**Response:**
```javascript
{
  success: true,
  rating: 4.5,
  name: "John Doe",
  phone: "+919999999999",
  activeRole: "CAPTAIN"
}
```

**Note:** This endpoint doesn't return points by default. The Waiting page fetches user details and gets points from there if needed.

---

## Socket Events

### Ride Decision (Updated)
```javascript
socket.emit("ride:decision", {
  rideId: "ride123",
  captainId: "captain_user_id",
  decision: "ACCEPTED",  // or "REJECTED"
  overlap: 85.5,
  matchedRoute: "encoded_polyline_string"  // NEW
}, callback);

// Server automatically stores captain details when ACCEPTED
```

---

## Example Usage in Frontend

### Save Vehicle Details
```javascript
try {
  const response = await API.post("/captain/vehicle-details", {
    vehicleNumber: "KA-05-AB-1234",
    vehicleColor: "White",
    vehicleModel: "Toyota Fortuner"
  });
  console.log("Saved:", response.data);
} catch (error) {
  console.error("Error:", error.response.data.message);
}
```

### Get Ride Details with Captain Info
```javascript
try {
  const response = await API.get(`/rides/${rideId}`);
  const { ride } = response.data;
  
  // Use captain details
  console.log("Captain:", ride.captainDetails.name);
  console.log("Vehicle:", ride.captainDetails.vehicleDetails);
  
  // Use matched route for map
  const matchedRoute = ride.matchedRoute;
  
} catch (error) {
  console.error("Error:", error);
}
```

### Complete Ride and Transfer Points
```javascript
try {
  // 1. Complete the ride
  const completeRes = await API.post(`/rides/${rideId}/complete`, {
    distanceInKm: 35
  });
  
  // 2. Transfer points
  const pointsRes = await API.post("/user/transfer-points", {
    rideId,
    captainId,
    riderId,
    distanceInKm: 35
  });
  
  console.log("Points earned:", completeRes.data.pointsEarned);
  console.log("Captain balance:", pointsRes.data.captainNewBalance);
  console.log("Rider balance:", pointsRes.data.riderNewBalance);
  
} catch (error) {
  console.error("Error:", error);
}
```

---

## Error Handling

### Common Error Scenarios

**Missing Authentication:**
```javascript
// Any auth-required endpoint without token
{
  success: false,
  message: "Unauthorized"
}
```

**Invalid Data Format:**
```javascript
{
  success: false,
  message: "rideId, captainId, riderId, and distanceInKm are required"
}
```

**Resource Not Found:**
```javascript
{
  success: false,
  message: "Ride not found"  // or "Captain not found", etc.
}
```

**Server Error:**
```javascript
{
  success: false,
  message: "Error message here"
}
```

---

## Rate Limiting & Best Practices

1. **Validate inputs** on frontend before API call
2. **Handle errors gracefully** with user-friendly messages
3. **Debounce** vehicle details save to prevent duplicate requests
4. **Cache** ride details to reduce API calls
5. **Show loading states** during API operations
6. **Test with edge cases**: Very long distances, boundary distances (e.g., 1.1 km)

---

## Testing with cURL

### Save Vehicle Details
```bash
curl -X POST http://localhost:5000/captain/vehicle-details \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleNumber": "KA-05-AB-1234",
    "vehicleColor": "White",
    "vehicleModel": "Toyota Fortuner"
  }'
```

### Get Vehicle Details
```bash
curl -X GET http://localhost:5000/captain/CAPTAIN_ID/vehicle-details \
  -H "Content-Type: application/json"
```

### Get Ride Details
```bash
curl -X GET http://localhost:5000/rides/RIDE_ID \
  -H "Content-Type: application/json"
```

### Complete Ride
```bash
curl -X POST http://localhost:5000/rides/RIDE_ID/complete \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "distanceInKm": 35
  }'
```

### Transfer Points
```bash
curl -X POST http://localhost:5000/user/transfer-points \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rideId": "RIDE_ID",
    "captainId": "CAPTAIN_ID",
    "riderId": "RIDER_ID",
    "distanceInKm": 35
  }'
```
