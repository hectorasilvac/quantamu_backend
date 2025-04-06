import { sql } from '../config/database.js';
import { throwError } from '../utils/error.uitl.js';
import { generateToken } from '../utils/auth.util.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

export const registerUser = async ({ firstName, lastName, email, password }) => {
  try {
    const userExist = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (userExist.length > 0) {
      throwError('User already exists.', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const newUser = await sql`
      INSERT INTO users (first_name, last_name, email, password)
      VALUES (${firstName}, ${lastName}, ${email}, ${hash})
      RETURNING *
    `;

    const token = generateToken({ id: newUser[0].id, email });

    return { 
      userId: newUser[0].id,
      firstName: newUser[0].first_name,
      lastName: newUser[0].last_name,
      email: newUser[0].email,
      token
    };
  } catch (error) {
    throw error;
  }
};

export const loginUser = async ({ email, password }) => {
  try {
    const user = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (user.length === 0) {
      throwError('Invalid credentials', 401);
    }

    const validPassword = await bcrypt.compare(password, user[0].password);
    if (!validPassword) {
      throwError('Invalid credentials', 401);
    }

    const token = generateToken({ id: user[0].id, email });

    return { 
      userId: user[0].id,
      firstName: user[0].first_name,
      lastName: user[0].last_name,
      email: user[0].email,
      token
    };
  } catch (error) {
    throw error;
  }
};