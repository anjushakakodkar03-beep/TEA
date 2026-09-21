# Blog Platform with Comments (Full-Stack)

This project is generated to implement:
- User registration/login (username, email, password, phoneNo)
- Create/Edit/Delete blog posts
- Rich post creation with:
  - heading/subheading
  - bold/italic
  - vibe color + blog type
  - alignment
  - cover image upload
  - stickers + doodles as draggable/resizable overlays (JSON)
- Comment section per post
- Backend REST APIs + MongoDB (with optional fallback to file storage if desired)

## Tech
- Backend: Node.js + Express + MongoDB (Mongoose)
- Frontend: React

## Quick start
### 1) Backend
```
cd blog-platform/backend
npm install
npm run dev
```

### 2) Frontend
```
cd ../frontend
npm install
npm start
```

## Environment variables
In `backend/.env`:
- `PORT=5000`
- `MONGO_URI=...`
- `JWT_SECRET=...`
- `CLIENT_URL=http://localhost:3000`


