import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Get user profile
router.get('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    res.json({ 
      success: true, 
      data: (req as any).user 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching profile' 
    });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (_req: Request, res: Response) => {
  try {
    res.json({ 
      success: true, 
      message: 'Profile updated successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error updating profile' 
    });
  }
});

export default router;
