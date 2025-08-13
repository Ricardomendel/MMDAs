import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Get revenue categories
router.get('/categories', authMiddleware, async (_req: Request, res: Response) => {
  try {
    res.json({ 
      success: true, 
      data: [] 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching revenue categories' 
    });
  }
});

// Get assessments
router.get('/assessments', authMiddleware, async (_req: Request, res: Response) => {
  try {
    res.json({ 
      success: true, 
      data: [] 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching assessments' 
    });
  }
});

export default router;
