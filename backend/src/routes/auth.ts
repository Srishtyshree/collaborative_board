import { Router } from 'express';
import { signup, login, googleLogin } from '../controllers/auth.controller';
import passport from '../lib/passport';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

router.post('/signup', signup);
router.post('/login', login);
router.post('/google', googleLogin as any);

// Google OAuth routes (Redirect Flow)
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const user = req.user as any;
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    // Redirect to frontend with token and user info in URL
    res.redirect(`${process.env.FRONTEND_URL}/login-success?token=${token}&id=${user.id}&name=${encodeURIComponent(user.name)}&email=${user.email}`);
  }
);

export default router;
