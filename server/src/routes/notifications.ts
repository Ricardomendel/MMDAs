import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Get notifications
router.get('/', authMiddleware, async (_req: Request, res: Response) => {
  try {
    res.json({ 
      success: true, 
      data: [] 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching notifications' 
    });
  }
});

// Mark notification as read
router.put('/:id/read', authMiddleware, async (_req: Request, res: Response) => {
  try {
    res.json({ 
      success: true, 
      message: 'Notification marked as read' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error updating notification' 
    });
  }
});

export default router;
