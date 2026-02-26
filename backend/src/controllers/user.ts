import { type Request, type Response } from "express";
import User from "../models/user";
import { generateToken } from "../utils/generateToken";

// @dsc Register a new user
// @route POST/api/users/registerUser
// @access private(Admin and teacher only)

export const registerUser = async ( req: Request, res: Response ): Promise<void> => {
    try {
        const {
            name, email, password, role, studentClass, teacherSubject, isActive
        } = req.body;
        const existingUser = await User.findOne({ email });

        // check if user already exists
        if(existingUser)
        {
            res.status(400).json({ message: "User already exists" });
        }

        //create user
        const newUser = await User.create({
            name,
            email,
            password,
            role,
            studentClass,
            teacherSubject,
            isActive,
        }); 

        if(newUser) {
            res.status(201).json({
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                isActive: newUser.isActive,
                studentClass: newUser.studentClass,
                teacherSubject: newUser.teacherSubject,
                message: "User registered successfully"
            })
        }
        else
        {
            res.status(400).json({ message: "Invalid user data" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });  
    }
};

// @desc Auth user & get token
// @route POST/api/user/login
// @access Public

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        // check if user exists and password matches
        if(user && (await user.matchPassword(password))){
            // generate token
            generateToken
        }
    } catch (error) {
        
    }
};