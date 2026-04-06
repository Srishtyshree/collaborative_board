import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export const signup = async (req: Request, res: Response) => {
    const { email, password, name } = req.body;

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
            },
        });

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ user: { id: user.id, email: user.email, name: user.name }, token });
    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
};

export const googleLogin = async (req: Request, res: Response) => {
    const { token } = req.body;
    try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const googleUser = await userInfoRes.json();
        
        if (!userInfoRes.ok) {
            return res.status(401).json({ error: 'Invalid Google token' });
        }

        const { email, name } = googleUser;

        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            const randomPassword = await bcrypt.hash(Math.random().toString(36).slice(-10), 10);
            user = await prisma.user.create({
                data: {
                    email,
                    password: randomPassword,
                    name: name || 'Google User',
                }
            });
        }

        const jwtToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ user: { id: user.id, email: user.email, name: user.name }, token: jwtToken });
    } catch (error) {
        console.error('Google Login Error:', error);
        res.status(500).json({ error: 'Failed to authenticate with Google' });
    }
};
