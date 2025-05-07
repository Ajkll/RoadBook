import { prisma } from '../../config/prisma';
import request from 'supertest';
import express from 'express';
import routes from '../../api/routes';
import { generateJwtToken } from '../../services/auth.service';
import { createUser } from '../../services/user.service';
import { hashPassword } from '../../utils/validation';

// Mock application setup
const app = express();
app.use(express.json());
app.use('/api', routes);

describe('Integration Tests - API Routes', () => {
  let adminToken: string;
  let apprenticeToken: string;
  let adminId: string;
  let apprenticeId: string;
  let roadbookId: string;
  
  beforeAll(async () => {
    // Clean test data
    await prisma.notification.deleteMany();
    await prisma.userBadge.deleteMany();
    await prisma.badge.deleteMany();
    await prisma.like.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.post.deleteMany();
    await prisma.competencyValidation.deleteMany();
    await prisma.competencyProgress.deleteMany();
    await prisma.session.deleteMany();
    await prisma.roadBook.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany({ where: { email: { in: ['admin@test.com', 'apprentice@test.com'] } } });
    
    // Create test users
    const adminUser = await createUser({
      email: 'admin@test.com',
      password: await hashPassword('Test123!'),
      displayName: 'Admin Test',
      role: 'ADMIN'
    });
    
    const apprenticeUser = await createUser({
      email: 'apprentice@test.com',
      password: await hashPassword('Test123!'),
      displayName: 'Apprentice Test',
      role: 'APPRENTICE'
    });
    
    adminId = adminUser.id;
    apprenticeId = apprenticeUser.id;
    
    // Generate tokens
    adminToken = generateJwtToken(adminUser);
    apprenticeToken = generateJwtToken(apprenticeUser);
  });
  
  afterAll(async () => {
    await prisma.$disconnect();
  });
  
  describe('Authentication & User API', () => {
    test('should return current user details with valid token', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(adminId);
      expect(res.body.email).toBe('admin@test.com');
      expect(res.body.role).toBe('ADMIN');
    });
    
    test('should update user profile', async () => {
      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${apprenticeToken}`)
        .send({
          displayName: 'Updated Name',
          bio: 'Test bio content'
        });
      
      expect(res.status).toBe(200);
      expect(res.body.displayName).toBe('Updated Name');
      expect(res.body.bio).toBe('Test bio content');
    });
  });
  
  describe('Roadbook API', () => {
    test('should create a new roadbook', async () => {
      const res = await request(app)
        .post('/api/roadbooks')
        .set('Authorization', `Bearer ${apprenticeToken}`)
        .send({
          title: 'Test Roadbook',
          description: 'Test roadbook description',
          targetHours: 30
        });
      
      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Test Roadbook');
      roadbookId = res.body.id;
    });
    
    test('should retrieve roadbook by ID', async () => {
      const res = await request(app)
        .get(`/api/roadbooks/${roadbookId}`)
        .set('Authorization', `Bearer ${apprenticeToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(roadbookId);
      expect(res.body.title).toBe('Test Roadbook');
    });
  });
  
  describe('Badge API', () => {
    let badgeId: string;
    
    test('should create a badge as admin', async () => {
      const res = await request(app)
        .post('/api/badges')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Badge',
          description: 'Test badge description',
          imageUrl: 'https://example.com/badge.png',
          category: 'BEGINNER',
          criteria: 'FIRST_SESSION'
        });
      
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Test Badge');
      badgeId = res.body.id;
    });
    
    test('should award a badge to user', async () => {
      const res = await request(app)
        .post('/api/badges/award')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: apprenticeId,
          badgeId
        });
      
      expect(res.status).toBe(201);
      expect(res.body.userId).toBe(apprenticeId);
      expect(res.body.badgeId).toBe(badgeId);
    });
    
    test('should retrieve user badges', async () => {
      const res = await request(app)
        .get(`/api/badges/users/${apprenticeId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].badgeId).toBe(badgeId);
    });
  });
  
  describe('Community API', () => {
    let postId: string;
    
    test('should create a post', async () => {
      const res = await request(app)
        .post('/api/community')
        .set('Authorization', `Bearer ${apprenticeToken}`)
        .send({
          title: 'Test Post',
          content: 'This is a test post content',
          mediaUrls: []
        });
      
      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Test Post');
      expect(res.body.authorId).toBe(apprenticeId);
      postId = res.body.id;
    });
    
    test('should add a comment to a post', async () => {
      const res = await request(app)
        .post(`/api/community/${postId}/comments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          content: 'This is a test comment'
        });
      
      expect(res.status).toBe(201);
      expect(res.body.content).toBe('This is a test comment');
      expect(res.body.authorId).toBe(adminId);
    });
    
    test('should like a post', async () => {
      const res = await request(app)
        .post(`/api/community/${postId}/likes`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(201);
      expect(res.body.postId).toBe(postId);
      expect(res.body.userId).toBe(adminId);
    });
  });
  
  describe('Notification API', () => {
    test('should check user notifications', async () => {
      // Badge award should have created a notification
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${apprenticeToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.notifications.length).toBeGreaterThan(0);
      
      // Check if there's a badge notification
      const badgeNotification = res.body.notifications.find(
        (n: any) => n.type === 'BADGE_EARNED'
      );
      expect(badgeNotification).toBeDefined();
    });
    
    test('should mark all notifications as read', async () => {
      const res = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${apprenticeToken}`);
      
      expect(res.status).toBe(200);
      
      // Verify all are read
      const checkRes = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${apprenticeToken}`);
      
      expect(checkRes.status).toBe(200);
      expect(checkRes.body.count).toBe(0);
    });
  });
});