import jwt from 'jsonwebtoken';
import { type Response } from 'express';

export const generateToken = (userId: String, res: Response) => {
    const token = jwt.sign({userId}, process.env.JWT_SECRET as string, {
        expiresIn: "30d",
        algorithm: "HS256",
        
    });
    res.cookie("jwt", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: "/",
    })
};