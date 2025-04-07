import { register, login, updateUser, deleteUser, fetchUsers } from '../services/users.service.js';

export const getUsers = async (req, res) => {
  try {
      const users = await fetchUsers();
      res.status(200).json({
          success: true,
          data: users,
          count: users?.length || 0,
          message: 'Users retrieved successfully.'
      })
  } catch (error) {
      res.status(500).json({
          success: false,
          data: null,
          message: `Error retrieving users: ${error.message}`
      })
  }
}

export const signUp = async (req, res) => {
    const userData = req.body;

    try {
        const user = await register({ 
            first_name: userData[0].first_name, 
            last_name: userData[0].last_name, 
            email: userData[0].email, 
            password: userData[0].password, 
            plan_id: userData[0].plan_id 
        });
        res.status(201).json({
            success: true,
            data: user.id,
            message: 'User registered successfully.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            data: null,
            message: error.message
        });
    }
}

export const signIn = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await login({ email, password });
        res.status(200).json({
            success: true,
            data: user,
            message: 'User logged in successfully.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            data: null,
            message: error.message
        });
    }
}

export const editUser = async (req, res) => {
    const userData = req.body;
    try {
        const user = await updateUser({
            id: userData[0].id, 
            first_name: userData[0].first_name, 
            last_name: userData[0].last_name, 
            email: userData[0].email, 
            password: userData[0].password, 
            role: userData[0].role, 
            plan_id: userData[0].plan_id 
        });
        res.status(200).json({
            success: true,
            data: user,
            message: 'User edited successfully.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            data: null,
            message: error.message
        });
    }
}


export const removeUser = async (req, res) => {
    const { id } = req.body[0];
    try {
        const user = await deleteUser({ id });
        res.status(200).json({
            success: true,
            data: user,
            message: 'User deleted successfully.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            data: null,
            message: error.message
        });
    }
}