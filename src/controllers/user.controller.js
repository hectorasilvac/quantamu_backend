import { registerUser, loginUser } from '../services/user.service.js';

export const registerUserController = async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    try {
        const user = await registerUser({ firstName, lastName, email, password });
        res.status(201).json({
            success: true,
            data: user,
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

export const loginUserController = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await loginUser({ email, password });
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
