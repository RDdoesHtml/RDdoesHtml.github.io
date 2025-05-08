import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";

// Auth middleware
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // User login history routes
  app.get('/api/user/login-history', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const loginHistory = await storage.getLoginHistory(userId, limit);
      res.json(loginHistory);
      
      // Record this activity
      await storage.recordActivity(userId, 'view_login_history', req.path);
    } catch (error) {
      console.error('Error fetching login history:', error);
      res.status(500).json({ error: 'Failed to fetch login history' });
    }
  });
  
  // User activity routes
  app.get('/api/user/activity', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const activities = await storage.getUserActivities(userId, limit);
      res.json(activities);
      
      // Record this activity
      await storage.recordActivity(userId, 'view_activity_log', req.path);
    } catch (error) {
      console.error('Error fetching user activity:', error);
      res.status(500).json({ error: 'Failed to fetch activity data' });
    }
  });
  
  // User statistics route
  app.get('/api/user/stats', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
      
      // Record this activity
      await storage.recordActivity(userId, 'view_stats', req.path);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({ error: 'Failed to fetch user statistics' });
    }
  });
  
  // Admin routes (we'll add a simple admin check)
  const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated() && req.user!.id === 1) { // Simple admin check - usually would use roles
      return next();
    }
    res.status(403).json({ error: 'Unauthorized: Admin access required' });
  };
  
  // Admin route to see recent logins across all users
  app.get('/api/admin/recent-logins', isAdmin, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const recentLogins = await storage.getRecentLogins(limit);
      res.json(recentLogins);
    } catch (error) {
      console.error('Error fetching recent logins:', error);
      res.status(500).json({ error: 'Failed to fetch recent logins' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
