import { type Request, type Response } from "express";
import User from "../models/user";
import { generateToken } from "../utils/generateToken";
import { logActivity } from "../utils/activiteslog";
import type { AuthRequest } from "../middleware/auth";

// @dsc Register a new user
// @route POST/api/users/registerUser
// @access private(Admin and teacher only)

export const register = async ( req: Request, res: Response ): Promise<void> => {
    try {
        const {
            name, email, password, role, studentClass, teacherSubject, isActive
        } = req.body;
        const existingUser = await User.findOne({ email });

        // check if user already exists
        if(existingUser)
        {
            res.status(400).json({ message: "User already exists" });
            return;
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
            // we don't have req.user type define , so we use a type assertion
            if((req as any).user) {
                await logActivity({
                    userId: (req as any).user._id,
                    action: "Registered User",
                    details: `Registered user with email: ${newUser.email}`, 
                })
            }
            res.status(201).json({
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                isActive: newUser.isActive,
                studentClass: newUser.studentClass,
                teacherSubject: newUser.teacherSubject,
                message: "User registered successfully"
            });
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

// export const login = async (req: Request, res: Response) => {
//     try {
//         const { email, password } = req.body;
//         const user = await User.findOne({ email });

//         // check if user exists and password matches
//         if(user && (await user.matchPassword(password))){
//             // generate token
//             generateToken(user.id.toString(), res);
//             res.json(user);
//         }else{
//             res.status(401).json({ message: "Invalid email or password" });
//         }
//     } catch (error) {
//         res.status(500).json({ message: "Server Error", error });
//     }
// };

// login without bug
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !(await user.matchPassword(password))) {
            res.status(401).json({ message: "Invalid email or password" });
            return;
        }

        // Check if account is active
        if (!user.isActive) {
            res.status(403).json({ message: "Account is deactivated" });
            return;
        }

        // Generate token
        generateToken(user._id.toString(), res);

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            studentClass: user.studentClass,
            teacherSubject: user.teacherSubject,
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

/**
 * @desc Update user (Admin)
 * @route PUT/api/users/:id
 * @access Private/Admin
 */
 
export const updateUser = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.id);

        if(user){
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.role = req.body.role || user.role;
            user.isActive = req.body.isActive != undefined ? req.body.isActive : user.isActive;
            user.studentClass = req.body.studentClass || user.studentClass;
            user.teacherSubject = req.body.teacherSubject || user.teacherSubject;

            if(req.body.password){
                user.password = req.body.password;
            }
            const updateUser = await user.save();
            if((req as any).user) {
                await logActivity({
                    userId: (req as any).user._id.toString(),
                    action: "Updated User",
                    details: `Update user with email: ${updateUser.email}`, 
                });
            }
            res.json({
                _id: updateUser._id,
                name: updateUser.name,
                email: updateUser.email,
                role: updateUser.role,
                isActive: updateUser.isActive,
                studentClass: updateUser.studentClass,
                teacherSubject: updateUser.teacherSubject,
                message: "User updated successfully",
            })
        }else{

        }
    } catch (error) {
        res.status(500).json({message: "server error", error});
    }
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        // Parse Query Params safely
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const role = req.query.role as string;
        const search = req.query.search as string; // for search

        const skip = (page - 1) * limit;

        // Build filter objects
        const filter: any = {};

        if(role && role != 'all' && role != "")
        {
            filter.role = role;
        }

        if(search) {
            filter.$or = [
                {name: {$regex: search, $options: "i"}},
                {email: {$regex: search, $options: "i"}},
            ];
        }
        // Fetch Users with Pagination & Filtering
        const [total, users] = await Promise.all([
            User.countDocuments(filter), //Get total count for pagination logic
            User.find(filter)
            .select("-password")
            // .populate("studentClass", "_id name section") // Added section for context
            // .populate("teacherSubjects", "_id name code") // Added section for context
            .sort({createdAt: -1})
            .skip(skip)
            .limit(limit),
        ]);

        // Send Response
        res.json({
            users,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
                limit,
            }
        });

    } catch (error) {
        res.status(500).json({message: "Server Error", error});
    };
};

// delete user(admin)
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.id);
        if(user) {
            await user.deleteOne();
            if((req as any).user) {
                await logActivity({
                    userId: (req as any).user._id.toString(),
                    action: "Deleted User",
                    details: `Delete user with email: ${user.email}`, 
                });
            }
            res.json({message: "User deleted successfully"});
        }else{
            res.status(404).json({message: "User not found"});
        }
    } catch (error) {
        res.status(500).json({message: "server error", error});
        console.error(error);
    }
};

// Get user profile(via cookie)

export const getUserProfile = async (req: AuthRequest, res: Response) => {
    try {
        if(req.user) {
            res.json({
                user: {
                    _id: req.user._id,
                    name: req.user.name,
                    email: req.user.email,
                    role: req.user.role,
                }
            });
        }else{
            res.status(401).json({message: "Not authorized"});
        }
    } catch (error) {
        res.status(500).json({message: "Server error", error});
        console.error(error);
    }
};

// Logout user / clear cookie
export const logoutUser = async (req: Request, res: Response) => {
    try {
        res.cookie("jwt", "", {
            httpOnly: true,
            expires: new Date(0), //expire the cookie immediately
        });
        res.json({message: "Logged out successfully"});
    } catch (error) {
        res.status(500).json({message: "server error", error});
        console.error(error);
    }
};

