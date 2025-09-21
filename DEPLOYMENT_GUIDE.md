# 🚀 BreakIn Deployment Guide

## Architecture Overview

```
┌─────────────────┐    HTTP/HTTPS     ┌─────────────────┐
│                 │ ──────────────► │                 │
│  Frontend       │                  │  Backend        │
│  (Vercel)       │ ◄────────────── │  (Railway)      │
│                 │                  │                 │
└─────────────────┘                  └─────────────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │                 │
                                    │  MongoDB Atlas  │
                                    │                 │
                                    └─────────────────┘
```

## 📋 Pre-Deployment Checklist

### ✅ Completed Setup:
- [x] API client created for frontend-backend communication
- [x] Frontend API routes updated to proxy to Railway backend
- [x] Environment variables template configured
- [x] Backend CORS updated for Vercel deployments
- [x] MongoDB client dependencies removed from frontend
- [x] API proxy helper created for scalable routing

### 🔧 What You Need to Do:

## 1. 🚂 Railway Backend Deployment

### Environment Variables to Set in Railway:
```env
MONGO_URI=mongodb+srv://Rams:Linux%401070@cluster0.ju4ejws.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
DB_NAME=breakin
SECRET_KEY=your-super-secret-jwt-key-here
JWT_EXPIRY_MINUTES=1440
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o
OPENAI_MAX_TOKENS=4000
LOG_LEVEL=INFO
ALLOWED_ORIGINS=["https://YOUR-VERCEL-DOMAIN.vercel.app", "https://*.vercel.app"]
```

### Steps:
1. Go to [Railway.app](https://railway.app)
2. Connect your GitHub repository
3. Select the `Backend` folder as root
4. Add the environment variables above
5. **Copy the Railway URL** (e.g., `https://your-app-name.railway.app`)

## 2. ⚡ Vercel Frontend Deployment

### Environment Variables to Set in Vercel:
```env
NEXT_PUBLIC_API_URL=https://YOUR-RAILWAY-DOMAIN.railway.app
```

### Steps:
1. Go to [Vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set Root Directory to `Frontend`
4. Add environment variables:
   - `NEXT_PUBLIC_API_URL` = Your Railway backend URL
5. Deploy!

## 3. 🔗 Connect Frontend to Backend

### Update Your URLs:
Replace `YOUR-RAILWAY-DOMAIN` and `YOUR-VERCEL-DOMAIN` in:

#### Backend Railway Environment:
```env
ALLOWED_ORIGINS=["https://YOUR-VERCEL-DOMAIN.vercel.app", "https://*.vercel.app"]
```

#### Frontend Vercel Environment:
```env
NEXT_PUBLIC_API_URL=https://YOUR-RAILWAY-DOMAIN.railway.app
```

## 4. 🧪 Testing the Connection

### Test API Connectivity:
```bash
# Test backend health
curl https://YOUR-RAILWAY-DOMAIN.railway.app/health

# Test frontend proxy to backend
curl https://YOUR-VERCEL-DOMAIN.vercel.app/api/developers
```

### Test in Browser:
1. Visit your Vercel frontend URL
2. Check browser console for API errors
3. Test authentication flow
4. Test sprint creation/management
5. Verify mentor dashboard functionality

## 🔧 Architecture Benefits

### What We've Built:
- **Separation of Concerns**: Frontend serves UI, backend handles data/logic
- **Scalable API Design**: Generic proxy system for easy endpoint management
- **Security**: No database credentials in frontend
- **Performance**: Frontend caching, backend optimization
- **Deployment Independence**: Frontend and backend can be deployed separately

### API Flow:
```
User → Vercel Frontend → Frontend API Route → Railway Backend → MongoDB Atlas
```

## 🛠️ Development vs Production

### Local Development:
```env
# Frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Production:
```env
# Vercel Environment Variables
NEXT_PUBLIC_API_URL=https://YOUR-RAILWAY-DOMAIN.railway.app
```

## 🚨 Troubleshooting

### Common Issues:

1. **CORS Errors**:
   - Check ALLOWED_ORIGINS in Railway includes your Vercel domain
   - Verify HTTPS vs HTTP in URLs

2. **API Connection Failed**:
   - Verify `NEXT_PUBLIC_API_URL` is set correctly in Vercel
   - Check Railway backend is running and accessible

3. **MongoDB Connection**:
   - Verify `MONGO_URI` is correct in Railway
   - Check MongoDB Atlas whitelist includes Railway IPs

4. **Build Errors**:
   - Remove any remaining MongoDB imports in frontend
   - Check all environment variables are set

## 📱 Final Verification

### ✅ Deployment Success Checklist:
- [ ] Railway backend URL responds to `/health`
- [ ] Vercel frontend loads without errors
- [ ] API calls from frontend reach Railway backend
- [ ] Authentication flow works
- [ ] Database operations work through backend
- [ ] Role-based navigation functions
- [ ] Mentor dashboard displays correctly

## 🔄 Future Updates

To update your application:
1. **Frontend changes**: Push to GitHub → Vercel auto-deploys
2. **Backend changes**: Push to GitHub → Railway auto-deploys
3. **Database changes**: Update through Railway backend only

---

## 📞 Need Help?

If you encounter issues:
1. Check Railway and Vercel logs
2. Verify environment variables are set
3. Test API endpoints directly
4. Check CORS configuration

Your BreakIn platform is now ready for production! 🚀