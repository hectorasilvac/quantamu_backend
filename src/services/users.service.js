import { sql } from '../config/database.js';
import { throwError } from '../utils/error.util.js';
import { generateToken } from '../utils/auth.util.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

export const fetchUsers = async () => {
  try {
    const users = await sql`SELECT * FROM users`;
    return users;
  } catch (error) {
    throw error;
  }
};

export const register = async ({ first_name, last_name, email, password, plan_id }) => {
  try {
    const userExist = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (userExist.length > 0) {
      throwError('User already exists.', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const newUser = await sql`
      INSERT INTO users (first_name, last_name, email, password, plan_id)
      VALUES (${first_name}, ${last_name}, ${email}, ${hash}, ${Number(plan_id)})
      RETURNING *
    `;
    
    const token = generateToken({ 
      id: newUser[0].id, 
      role: newUser[0].role, 
      email,
      first_name: newUser[0].first_name,
      last_name: newUser[0].last_name,
      plan_id: newUser[0].plan_id
    });

    return { 
      id: [newUser[0].id],
      token,
    };
  } catch (error) {
    throw error;
  }
};

export const login = async ({ email, password }) => {
  try {
    const user = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (user.length === 0) {
      throwError('Invalid credentials', 401);
    }

    const validPassword = await bcrypt.compare(password, user[0].password);
    if (!validPassword) {
      throwError('Invalid credentials', 401);
    }

    const token = generateToken({ 
      id: user[0].id, 
      role: user[0].role,
      plan_id: user[0].plan_id,
      email,
      firstName: user[0].first_name,
      lastName: user[0].last_name,
    });

    return { 
      token
    };
  } catch (error) {
    throw error;
  }
};

export const updateUser = async ({ id, first_name, last_name, email, password, role, plan_id }) => {
  try {
    const userExists = await sql`SELECT * FROM users WHERE id = ${id}`;
    if (userExists.length === 0) {
      throwError('User not found', 404);
    }

    if (email) {
      const emailExists = await sql`SELECT * FROM users WHERE email = ${email} AND id != ${id}`;
      if (emailExists.length > 0) {
        throwError('Email already in use', 400);
      }
    }

    let hashedPassword = password;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }
    
    const updatedUser = await sql`
      UPDATE users
      SET 
        first_name = COALESCE(${first_name}, first_name),
        last_name = COALESCE(${last_name}, last_name),
        email = COALESCE(${email}, email),
        password = COALESCE(${hashedPassword}, password),
        role = COALESCE(${role}, role),
        plan_id = COALESCE(${Number(plan_id)}, plan_id)
      WHERE id = ${id}
      RETURNING *
    `;

    return {
      user: {
        id: updatedUser[0].id,
        first_name: updatedUser[0].first_name,
        last_name: updatedUser[0].last_name,
        email: updatedUser[0].email,
        role: updatedUser[0].role,
        plan_id: updatedUser[0].plan_id
      }
    };
  } catch (error) {
    throw error;
  }
};

export const deleteUser = async ({ id }) => {
  try {
    const userExists = await sql`SELECT * FROM users WHERE id = ${id}`;
    if (userExists.length === 0) {
      throwError('User not found', 404);
    }

    await sql`DELETE FROM users WHERE id = ${id}`;

    return {
      message: 'User deleted successfully'
    };
  } catch (error) {
    throw error;
  }
};
