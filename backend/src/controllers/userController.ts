import { Request, Response } from 'express';
import { dataStore } from '../models/DataStore';
import { ApiResponse, CreateUserRequest } from '../types';

export const createUser = (req: Request<{}, ApiResponse<any>, CreateUserRequest>, res: Response<ApiResponse<any>>) => {
  try {
    const { aliasName } = req.body;

    if (!aliasName || aliasName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Alias name is required and cannot be empty'
      });
    }

    const user = dataStore.createUser(aliasName.trim());
    
    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getUsers = (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const users = dataStore.getAllUsers();
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getUserById = (req: Request<{ id: string }>, res: Response<ApiResponse<any>>) => {
  try {
    const { id } = req.params;
    const user = dataStore.getUserById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
