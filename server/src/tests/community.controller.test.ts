import { Request, Response } from 'express';
import * as communityController from '../controllers/community.controller';
import * as communityService from '../services/community.service';

// Mock community service
jest.mock('../services/community.service');

describe('Community Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  beforeEach(() => {
    responseJson = jest.fn().mockReturnValue({});
    responseStatus = jest.fn().mockReturnThis();

    mockRequest = {
      params: {},
      query: {},
      body: {},
      user: { id: 'user1' },
    };

    mockResponse = {
      json: responseJson,
      status: responseStatus,
    };

    jest.clearAllMocks();
  });

  describe('getPosts', () => {
    it('should get all posts successfully', async () => {
      const mockPosts = {
        posts: [{ id: 'post1', title: 'Test Post' }],
        total: 1,
        pages: 1,
      };
      
      (communityService.getPosts as jest.Mock).mockResolvedValue(mockPosts);

      await communityController.getPosts(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(communityService.getPosts).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(mockPosts);
    });

    it('should handle errors', async () => {
      (communityService.getPosts as jest.Mock).mockRejectedValue(new Error('Test error'));

      await communityController.getPosts(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Failed to retrieve posts'
      }));
    });

    it('should pass pagination parameters to service', async () => {
      mockRequest.query = {
        page: '2',
        limit: '10',
        sort: 'createdAt',
        order: 'desc',
      };

      await communityController.getPosts(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(communityService.getPosts).toHaveBeenCalledWith(
        {
          page: 2,
          limit: 10,
          sort: 'createdAt',
          order: 'desc',
        },
        'user1'
      );
    });
  });

  describe('getPostById', () => {
    it('should get a post by ID successfully', async () => {
      const mockPost = { id: 'post1', title: 'Test Post' };
      mockRequest.params = { postId: 'post1' };
      
      (communityService.getPostById as jest.Mock).mockResolvedValue(mockPost);

      await communityController.getPostById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(communityService.getPostById).toHaveBeenCalledWith('post1', 'user1');
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(mockPost);
    });

    it('should return 404 when post not found', async () => {
      mockRequest.params = { postId: 'nonexistent' };
      
      (communityService.getPostById as jest.Mock).mockResolvedValue(null);

      await communityController.getPostById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Post not found'
      }));
    });

    it('should return 403 when user does not have permission', async () => {
      mockRequest.params = { postId: 'post1' };
      
      (communityService.getPostById as jest.Mock).mockRejectedValue(
        new Error('You do not have permission to view this post')
      );

      await communityController.getPostById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseStatus).toHaveBeenCalledWith(403);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        message: 'You do not have permission to view this post'
      }));
    });
  });

  describe('createPost', () => {
    it('should create a post successfully', async () => {
      const postData = { title: 'New Post', content: 'Content' };
      mockRequest.body = postData;
      
      const createdPost = { id: 'post1', ...postData, authorId: 'user1' };
      (communityService.createPost as jest.Mock).mockResolvedValue(createdPost);

      await communityController.createPost(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(communityService.createPost).toHaveBeenCalledWith('user1', postData);
      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith(createdPost);
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.user = undefined;

      await communityController.createPost(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(communityService.createPost).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(401);
    });

    it('should return 400 if missing required fields', async () => {
      mockRequest.body = { content: 'Missing title' };

      await communityController.createPost(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(communityService.createPost).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
    });

    it('should return 429 if rate limited', async () => {
      mockRequest.body = { title: 'New Post', content: 'Content' };
      
      (communityService.createPost as jest.Mock).mockRejectedValue(
        new Error('Rate limit exceeded for posting. Try again later.')
      );

      await communityController.createPost(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseStatus).toHaveBeenCalledWith(429);
    });
  });

  describe('updatePost', () => {
    it('should update a post successfully', async () => {
      mockRequest.params = { postId: 'post1' };
      mockRequest.body = { title: 'Updated Title' };
      
      const updatedPost = { id: 'post1', title: 'Updated Title', authorId: 'user1' };
      (communityService.updatePost as jest.Mock).mockResolvedValue(updatedPost);

      await communityController.updatePost(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(communityService.updatePost).toHaveBeenCalledWith('post1', 'user1', { title: 'Updated Title' });
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(updatedPost);
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.user = undefined;

      await communityController.updatePost(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseStatus).toHaveBeenCalledWith(401);
    });

    it('should return 400 if no update fields provided', async () => {
      mockRequest.params = { postId: 'post1' };
      mockRequest.body = {};

      await communityController.updatePost(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseStatus).toHaveBeenCalledWith(400);
    });

    it('should return 403 if not authorized', async () => {
      mockRequest.params = { postId: 'post1' };
      mockRequest.body = { title: 'Updated Title' };
      
      (communityService.updatePost as jest.Mock).mockRejectedValue(
        new Error('You do not have permission to update this post')
      );

      await communityController.updatePost(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseStatus).toHaveBeenCalledWith(403);
    });
  });

  describe('deletePost', () => {
    it('should delete a post successfully', async () => {
      mockRequest.params = { postId: 'post1' };
      
      (communityService.deletePost as jest.Mock).mockResolvedValue(true);

      await communityController.deletePost(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(communityService.deletePost).toHaveBeenCalledWith('post1', 'user1');
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Post deleted successfully'
      }));
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.user = undefined;

      await communityController.deletePost(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseStatus).toHaveBeenCalledWith(401);
    });

    it('should return 403 if not authorized', async () => {
      mockRequest.params = { postId: 'post1' };
      
      (communityService.deletePost as jest.Mock).mockRejectedValue(
        new Error('You do not have permission to delete this post')
      );

      await communityController.deletePost(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseStatus).toHaveBeenCalledWith(403);
    });
  });

  describe('addComment', () => {
    it('should add a comment successfully', async () => {
      mockRequest.params = { postId: 'post1' };
      mockRequest.body = { content: 'New comment' };
      
      const createdComment = { id: 'comment1', content: 'New comment', authorId: 'user1' };
      (communityService.addComment as jest.Mock).mockResolvedValue(createdComment);

      await communityController.addComment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(communityService.addComment).toHaveBeenCalledWith('post1', 'user1', 'New comment');
      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith(createdComment);
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.user = undefined;

      await communityController.addComment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseStatus).toHaveBeenCalledWith(401);
    });

    it('should return 400 if content is missing', async () => {
      mockRequest.params = { postId: 'post1' };
      mockRequest.body = {};

      await communityController.addComment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseStatus).toHaveBeenCalledWith(400);
    });

    it('should return 429 if rate limited', async () => {
      mockRequest.params = { postId: 'post1' };
      mockRequest.body = { content: 'New comment' };
      
      (communityService.addComment as jest.Mock).mockRejectedValue(
        new Error('Rate limit exceeded for commenting')
      );

      await communityController.addComment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseStatus).toHaveBeenCalledWith(429);
    });
  });

  describe('likePost', () => {
    it('should like a post successfully', async () => {
      mockRequest.params = { postId: 'post1' };
      
      const like = { id: 'like1', postId: 'post1', userId: 'user1' };
      (communityService.likePost as jest.Mock).mockResolvedValue(like);

      await communityController.likePost(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(communityService.likePost).toHaveBeenCalledWith('post1', 'user1');
      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith(like);
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.user = undefined;

      await communityController.likePost(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseStatus).toHaveBeenCalledWith(401);
    });

    it('should return 409 if already liked', async () => {
      mockRequest.params = { postId: 'post1' };
      
      (communityService.likePost as jest.Mock).mockRejectedValue(
        new Error('You have already liked this post')
      );

      await communityController.likePost(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseStatus).toHaveBeenCalledWith(409);
    });
  });

  describe('searchPosts', () => {
    it('should search posts successfully', async () => {
      mockRequest.query = { q: 'test' };
      
      const searchResults = {
        posts: [{ id: 'post1', title: 'Test Post' }],
        total: 1,
        pages: 1,
      };
      
      (communityService.searchPosts as jest.Mock).mockResolvedValue(searchResults);

      await communityController.searchPosts(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(communityService.searchPosts).toHaveBeenCalledWith('test', expect.any(Object), 'user1');
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(searchResults);
    });

    it('should return 400 if query is too short', async () => {
      mockRequest.query = { q: 'a' }; // Less than 2 characters

      await communityController.searchPosts(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseStatus).toHaveBeenCalledWith(400);
    });
  });
});