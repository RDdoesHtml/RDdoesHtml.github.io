import { db } from "@db";
import { users, loginHistory, userActivity } from "@shared/schema";
import { eq, desc, and, or, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "@db";
import { Request } from "express";

export interface IStorage {
  getUser(id: number): Promise<any>;
  getUserByUsername(username: string): Promise<any>;
  createUser(userData: any): Promise<any>;
  updateUser(id: number, userData: any): Promise<any>;
  deleteUser(id: number): Promise<any>;
  
  // Login history methods
  recordLogin(userId: number, req: Request, success: boolean, method?: string, failureReason?: string): Promise<any>;
  getLoginHistory(userId: number, limit?: number): Promise<any[]>;
  
  // User activity methods
  recordActivity(userId: number, activityType: string, path?: string, details?: any): Promise<any>;
  getUserActivities(userId: number, limit?: number): Promise<any[]>;
  
  // Analytics methods
  getUserStats(userId: number): Promise<any>;
  getRecentLogins(limit?: number): Promise<any[]>;
  
  sessionStore: session.Store;
}

const PostgresSessionStore = connectPg(session);

class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true,
      tableName: 'user_sessions'
    });
  }

  async getUser(id: number) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id)
    });
    return user;
  }

  async getUserByUsername(username: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.username, username)
    });
    return user;
  }

  async createUser(userData: any) {
    const [newUser] = await db.insert(users)
      .values(userData)
      .returning();
    return newUser;
  }

  async updateUser(id: number, userData: any) {
    const [updatedUser] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number) {
    const [deletedUser] = await db.delete(users)
      .where(eq(users.id, id))
      .returning();
    return deletedUser;
  }
  
  // Login history methods
  async recordLogin(userId: number, req: Request, success: boolean, method = 'password', failureReason?: string) {
    // Extract user agent information
    const userAgent = req.get('user-agent') || '';
    const ipAddress = req.ip || req.socket.remoteAddress || '';
    
    // Simple browser/OS detection
    const browser = this.detectBrowser(userAgent);
    const os = this.detectOS(userAgent);
    const device = this.detectDevice(userAgent);
    
    // Update user's last login if successful
    if (success) {
      await db.update(users)
        .set({ lastLogin: new Date() })
        .where(eq(users.id, userId));
    }
    
    // Record login attempt
    const [record] = await db.insert(loginHistory)
      .values({
        userId,
        ipAddress: ipAddress.substring(0, 45), // Ensure it fits in varchar(45)
        userAgent,
        browser,
        os,
        device,
        loginMethod: method,
        success,
        failureReason,
        metadata: {}, // Empty object as default
      })
      .returning();
      
    return record;
  }
  
  async getLoginHistory(userId: number, limit = 20) {
    return await db.query.loginHistory.findMany({
      where: eq(loginHistory.userId, userId),
      orderBy: desc(loginHistory.timestamp),
      limit,
    });
  }
  
  // User activity methods
  async recordActivity(userId: number, activityType: string, path?: string, details?: any) {
    const [activity] = await db.insert(userActivity)
      .values({
        userId,
        activityType,
        path,
        details: details || {},
      })
      .returning();
      
    return activity;
  }
  
  async getUserActivities(userId: number, limit = 20) {
    return await db.query.userActivity.findMany({
      where: eq(userActivity.userId, userId),
      orderBy: desc(userActivity.timestamp),
      limit,
    });
  }
  
  // Analytics methods
  async getUserStats(userId: number) {
    // Get count of logins
    const loginCount = await db.select({ count: sql`COUNT(*)` })
      .from(loginHistory)
      .where(eq(loginHistory.userId, userId))
      .then(res => Number(res[0].count));
    
    // Get count of activities
    const activityCount = await db.select({ count: sql`COUNT(*)` })
      .from(userActivity)
      .where(eq(userActivity.userId, userId))
      .then(res => Number(res[0].count));
    
    // Get first login
    const firstLogin = await db.query.loginHistory.findFirst({
      where: eq(loginHistory.userId, userId),
      orderBy: loginHistory.timestamp,
    });
    
    // Get most recent failed login (if any)
    const lastFailedLogin = await db.query.loginHistory.findFirst({
      where: and(
        eq(loginHistory.userId, userId),
        eq(loginHistory.success, false)
      ),
      orderBy: desc(loginHistory.timestamp),
    });
    
    // Get unique IP addresses
    const uniqueIps = await db.select({ ip: loginHistory.ipAddress })
      .from(loginHistory)
      .where(eq(loginHistory.userId, userId))
      .groupBy(loginHistory.ipAddress)
      .then(res => res.map(row => row.ip).filter(Boolean));
    
    return {
      userId,
      loginCount,
      activityCount,
      firstLoginAt: firstLogin?.timestamp,
      lastFailedLoginAt: lastFailedLogin?.timestamp,
      uniqueIpCount: uniqueIps.length,
      uniqueIps,
    };
  }
  
  async getRecentLogins(limit = 10) {
    return await db.query.loginHistory.findMany({
      orderBy: desc(loginHistory.timestamp),
      limit,
      with: {
        user: true,
      },
    });
  }
  
  // Helper methods for user agent parsing
  private detectBrowser(userAgent: string): string {
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edg')) return 'Edge';
    if (userAgent.includes('MSIE') || userAgent.includes('Trident/')) return 'Internet Explorer';
    return 'Unknown';
  }
  
  private detectOS(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac OS X')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
    return 'Unknown';
  }
  
  private detectDevice(userAgent: string): string {
    if (userAgent.includes('iPhone')) return 'iPhone';
    if (userAgent.includes('iPad')) return 'iPad';
    if (userAgent.includes('Android') && userAgent.includes('Mobile')) return 'Android Phone';
    if (userAgent.includes('Android')) return 'Android Tablet';
    if (userAgent.match(/Windows NT.*Touch/)) return 'Windows Tablet';
    if (userAgent.includes('Mobile') || userAgent.includes('Mobi')) return 'Mobile';
    return 'Desktop';
  }
}

export const storage = new DatabaseStorage();
