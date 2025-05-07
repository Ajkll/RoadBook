"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCrudService = createCrudService;
exports.createCrudController = createCrudController;
/**
 * Generic CRUD Service Factory for Prisma Models
 * This module provides a factory function that generates CRUD operations for any Prisma model
 */
const prisma_1 = __importDefault(require("../config/prisma"));
/**
 * Creates a set of CRUD operations for a Prisma model
 *
 * @param model The Prisma model name (as a string)
 * @param options Configuration options for the CRUD operations
 * @returns Object with CRUD functions for the specified model
 */
function createCrudService(model, options = {}) {
    // Get the Prisma model from the model name
    const prismaModel = prisma_1.default[model];
    if (!prismaModel) {
        throw new Error(`Invalid Prisma model: ${model}`);
    }
    // Default options
    const { createFields = [], excludeFromUpdate = ['id', 'createdAt'], excludeFromResponse = [], uniqueFields = [], searchFields = [], includeRelations = {}, defaultOrderBy = { createdAt: 'desc' }, accessControl, beforeCreate, afterCreate, beforeUpdate, afterUpdate, beforeDelete, afterDelete } = options;
    // Create operation
    const create = async (data, userId) => {
        console.log(`[CRUD SERVICE] Creating ${model}:`, data);
        try {
            // Check access control if defined
            if (accessControl && userId) {
                const hasAccess = await accessControl(userId, data, 'create');
                if (!hasAccess) {
                    throw new Error(`Unauthorized to create ${model}`);
                }
            }
            // Check for unique constraints
            for (const field of uniqueFields) {
                if (data[field]) {
                    const exists = await prismaModel.findUnique({
                        where: { [field]: data[field] }
                    });
                    if (exists) {
                        throw new Error(`A ${model} with this ${field} already exists`);
                    }
                }
            }
            // Process data before creation
            let processedData = { ...data };
            // Apply beforeCreate hook if defined
            if (beforeCreate) {
                processedData = await beforeCreate(processedData);
            }
            // Create the item
            const created = await prismaModel.create({
                data: processedData,
                include: Object.keys(includeRelations).length > 0 ? includeRelations : undefined
            });
            // Apply afterCreate hook if defined
            let result = created;
            if (afterCreate) {
                result = await afterCreate(created);
            }
            // Remove excluded fields from response
            if (excludeFromResponse.length > 0) {
                result = { ...result };
                for (const field of excludeFromResponse) {
                    delete result[field];
                }
            }
            return result;
        }
        catch (error) {
            console.error(`[CRUD SERVICE] Error creating ${model}:`, error);
            throw error;
        }
    };
    // Read operation (get by ID)
    const getById = async (id, userId) => {
        console.log(`[CRUD SERVICE] Getting ${model} by ID: ${id}`);
        try {
            // Get the item
            const item = await prismaModel.findUnique({
                where: { id },
                include: Object.keys(includeRelations).length > 0 ? includeRelations : undefined
            });
            if (!item) {
                throw new Error(`${model} not found`);
            }
            // Check access control if defined
            if (accessControl && userId) {
                const hasAccess = await accessControl(userId, item, 'read');
                if (!hasAccess) {
                    throw new Error(`Unauthorized to access this ${model}`);
                }
            }
            // Remove excluded fields from response
            let result = { ...item };
            if (excludeFromResponse.length > 0) {
                for (const field of excludeFromResponse) {
                    delete result[field];
                }
            }
            return result;
        }
        catch (error) {
            console.error(`[CRUD SERVICE] Error getting ${model} by ID:`, error);
            throw error;
        }
    };
    // List operation (get many with filtering, pagination, and ordering)
    const getMany = async (query = {}, userId) => {
        console.log(`[CRUD SERVICE] Getting ${model} list with query:`, query);
        try {
            // Extract pagination and ordering parameters
            const { page = 1, limit = 20, orderBy, orderDirection = 'desc', search, ...filters } = query;
            const skip = (page - 1) * limit;
            // Build the where clause from filters
            const where = {};
            // Process text search if provided
            if (search && searchFields.length > 0) {
                where.OR = searchFields.map(field => ({
                    [field]: { contains: search, mode: 'insensitive' }
                }));
            }
            // Process other filters
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    where[key] = value;
                }
            });
            // Set up ordering
            const orderingField = orderBy || Object.keys(defaultOrderBy)[0];
            const ordering = {
                [orderingField]: orderDirection
            };
            // Fetch count for pagination
            const total = await prismaModel.count({ where });
            // Fetch items
            const items = await prismaModel.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: ordering,
                include: Object.keys(includeRelations).length > 0 ? includeRelations : undefined
            });
            // Apply access control if defined
            let filteredItems = items;
            if (accessControl && userId) {
                filteredItems = [];
                for (const item of items) {
                    try {
                        const hasAccess = await accessControl(userId, item, 'read');
                        if (hasAccess) {
                            filteredItems.push(item);
                        }
                    }
                    catch (error) {
                        console.error(`[CRUD SERVICE] Error checking access for ${model}:`, error);
                        // Skip this item if access check fails
                    }
                }
            }
            // Remove excluded fields from response
            if (excludeFromResponse.length > 0) {
                filteredItems = filteredItems.map(item => {
                    const result = { ...item };
                    for (const field of excludeFromResponse) {
                        delete result[field];
                    }
                    return result;
                });
            }
            return {
                items: filteredItems,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(total / Number(limit))
                }
            };
        }
        catch (error) {
            console.error(`[CRUD SERVICE] Error getting ${model} list:`, error);
            throw error;
        }
    };
    // Update operation
    const update = async (id, data, userId) => {
        console.log(`[CRUD SERVICE] Updating ${model} with ID: ${id}`);
        try {
            // Check if the item exists
            const existingItem = await prismaModel.findUnique({
                where: { id }
            });
            if (!existingItem) {
                throw new Error(`${model} not found`);
            }
            // Check access control if defined
            if (accessControl && userId) {
                const hasAccess = await accessControl(userId, existingItem, 'update');
                if (!hasAccess) {
                    throw new Error(`Unauthorized to update this ${model}`);
                }
            }
            // Filter out fields that should not be updated
            const updateData = { ...data };
            for (const field of excludeFromUpdate) {
                delete updateData[field];
            }
            // Check for unique constraints for updated fields
            for (const field of uniqueFields) {
                if (updateData[field] && updateData[field] !== existingItem[field]) {
                    const exists = await prismaModel.findUnique({
                        where: { [field]: updateData[field] }
                    });
                    if (exists) {
                        throw new Error(`A ${model} with this ${field} already exists`);
                    }
                }
            }
            // Process data before update
            let processedData = updateData;
            if (beforeUpdate) {
                processedData = await beforeUpdate(id, processedData);
            }
            // Update the item
            const updated = await prismaModel.update({
                where: { id },
                data: processedData,
                include: Object.keys(includeRelations).length > 0 ? includeRelations : undefined
            });
            // Apply afterUpdate hook if defined
            let result = updated;
            if (afterUpdate) {
                result = await afterUpdate(updated);
            }
            // Remove excluded fields from response
            if (excludeFromResponse.length > 0) {
                result = { ...result };
                for (const field of excludeFromResponse) {
                    delete result[field];
                }
            }
            return result;
        }
        catch (error) {
            console.error(`[CRUD SERVICE] Error updating ${model}:`, error);
            throw error;
        }
    };
    // Delete operation
    const remove = async (id, userId) => {
        console.log(`[CRUD SERVICE] Deleting ${model} with ID: ${id}`);
        try {
            // Check if the item exists
            const existingItem = await prismaModel.findUnique({
                where: { id }
            });
            if (!existingItem) {
                throw new Error(`${model} not found`);
            }
            // Check access control if defined
            if (accessControl && userId) {
                const hasAccess = await accessControl(userId, existingItem, 'delete');
                if (!hasAccess) {
                    throw new Error(`Unauthorized to delete this ${model}`);
                }
            }
            // Apply beforeDelete hook if defined
            if (beforeDelete) {
                await beforeDelete(id);
            }
            // Delete the item
            const deleted = await prismaModel.delete({
                where: { id }
            });
            // Apply afterDelete hook if defined
            if (afterDelete) {
                await afterDelete(deleted);
            }
            return deleted;
        }
        catch (error) {
            console.error(`[CRUD SERVICE] Error deleting ${model}:`, error);
            throw error;
        }
    };
    // Return all CRUD operations
    return {
        create,
        getById,
        getMany,
        update,
        remove
    };
}
/**
 * Creates a controller for a CRUD service
 *
 * @param crudService The CRUD service to create a controller for
 * @returns Object with controller functions for the CRUD service
 */
function createCrudController(crudService) {
    return {
        // Create controller
        create: async (req, res, next) => {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const result = await crudService.create(req.body, userId);
                res.status(201).json(result);
            }
            catch (error) {
                next(error);
            }
        },
        // Get by ID controller
        getById: async (req, res, next) => {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const result = await crudService.getById(req.params.id, userId);
                res.status(200).json(result);
            }
            catch (error) {
                next(error);
            }
        },
        // Get many controller
        getMany: async (req, res, next) => {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const result = await crudService.getMany(req.query, userId);
                res.status(200).json(result);
            }
            catch (error) {
                next(error);
            }
        },
        // Update controller
        update: async (req, res, next) => {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const result = await crudService.update(req.params.id, req.body, userId);
                res.status(200).json(result);
            }
            catch (error) {
                next(error);
            }
        },
        // Delete controller
        remove: async (req, res, next) => {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                await crudService.remove(req.params.id, userId);
                res.status(204).send();
            }
            catch (error) {
                next(error);
            }
        }
    };
}
