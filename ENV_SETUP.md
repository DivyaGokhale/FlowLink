# Environment Variables Setup

Create a `.env` file in the root directory with the following variables:

## Required Variables

### Server Configuration
```env
PORT=5001
JWT_SECRET=your-secret-key-change-this-in-production
ADMIN_USER_ID=HS9Yf7yCJ3Zc6MSIFDa3oOlN1Wl1
```

### MongoDB Configuration
```env
MONGO_URI=mongodb+srv://FlowLink:FlowLink8550@flowlink.wlohsvp.mongodb.net/?retryWrites=true&w=majority&appName=FlowLink
MONGO_DB_NAME=flowlink
```

### Razorpay Configuration (Backend)
```env
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
```

### Frontend Configuration
```env
VITE_API_BASE_URL=http://localhost:5001/api
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id_here
```

### Firebase Configuration (Optional)
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## Getting Razorpay Keys

1. Sign up at https://razorpay.com
2. Go to Dashboard > Settings > API Keys
3. Generate Test/Live keys
4. Copy the Key ID and Key Secret

**Note:** Make sure to add the `.env` file to your `.gitignore` to keep your secrets safe!
