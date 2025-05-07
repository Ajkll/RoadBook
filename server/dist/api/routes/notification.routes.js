"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const notificationController = __importStar(require("../../controllers/notification.controller"));
const router = (0, express_1.Router)();
// All notification routes require authentication
router.use(auth_middleware_1.authenticate);
// Get notifications
router.get('/', notificationController.getUserNotifications);
// Get unread count
router.get('/unread-count', notificationController.getUnreadCount);
// Mark notifications as read
router.put('/:notificationId/read', notificationController.markAsRead);
// Mark all notifications as read
router.put('/read-all', notificationController.markAllAsRead);
// Delete a notification
router.delete('/:notificationId', notificationController.deleteNotification);
// Delete all notifications
router.delete('/', notificationController.deleteAllNotifications);
// Admin-only route for cleanup
router.post('/cleanup', auth_middleware_1.authorizeAdmin, notificationController.cleanupOldNotifications);
exports.default = router;
