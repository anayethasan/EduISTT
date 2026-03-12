import mongoose from "mongoose";
import { type Request, type Response } from "express";
import AcademicYear from "../models/academicYear";
import { logActivity } from "../utils/activiteslog";


export const createAcademicYear = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, fromYear, toYear, isCurrent } = req.body;

        const existingYear = await AcademicYear.findOne({ fromYear, toYear });
        if (existingYear) {
            res.status(400).json({ message: "Academic Year already exists" });
            return;
        }
        // If isCurrent is true, set all other academic years to false
        if (isCurrent) {
            await AcademicYear.updateMany(
                { _id: { $ne: null } }, 
                { isCurrent: false });
        }

        const academicYear = await AcademicYear.create({
            name,
            fromYear,
            toYear,
            isCurrent: isCurrent || false,
        });

        await logActivity({
            userId: (req as any).user._id.toString(),
            action: "Created Academic Year",
            details: `Created academic year ${name}`,
        });

        res.status(201).json(academicYear);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};


/**
 * Get All Academic year (Paginated & Searchable)
 * GET/api/academic-years
 * Private/Admin
 */

export const getAllAcademicYears = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;

        // Build Search Query (Search by Name)
        const query: any = {};
        if(search){
            query.name = {$regex: search, $options: "i"};
        }
        const [total, years] = await Promise.all([
            AcademicYear.countDocuments(query),
            AcademicYear.find(query)
            .sort({ createdAt: -1 }) //Newest first
            .skip((page - 1) * limit)
            .limit(limit),
        ]);
        res.json({
            years,
            pagination: {
               total,
               page, 
               pages: Math.ceil(total / limit), 
            },
        });
    } catch (error) {
        res.status(500).json({message: "Server Error", error});
        console.error(error);
    }
};


/**
 * Get the current active Academic Year
 */


export const getCurrentAcademicYear = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const currentYear = await AcademicYear.findOne({ isCurrent: true });

        if(!currentYear) {
            res.status(404).json({ message: "No current academic year found" });
            return;
        } else {
            res.status(200).json(currentYear);
        }
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
        console.error(error);
    }
};

/**
 * Update Academic Year
 * PUT/api/academic-years/:id
 * Private/Admin
 */

export const updateAcademicYear = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const id = req.params.id as string;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: "Invalid Academic Year ID" });
            return;
        }

        const { isCurrent } = req.body;
        if (isCurrent) {
            await AcademicYear.updateMany(
                { _id: { $ne: new mongoose.Types.ObjectId(id) } },
                { isCurrent: false }
            );
        }

        const updatedYear = await AcademicYear.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedYear) {
            res.status(404).json({ message: "Academic Year not found" });
            return;
        }

        await logActivity({
            userId: (req as any).user._id.toString(),
            action: "Updated Academic Year",
            details: `Updated academic year ${updatedYear.name}`,
        });

        res.status(200).json(updatedYear);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

/**
 * Delete Academic Year
 * DELETE/api/academic-years/:id
 * Private/Admin
 */

export const deleteAcademicYear = async (
    req: Request,
    res: Response
): Promise<void> =>{
    try {
        const year = await AcademicYear.findById(req.params.id);
        if(!year)
        {
            res.status(404).json({ message: "Academic Year not found" });
            return;
        }
        if(year)
        {
            if(year.isCurrent) {
                res.status(400).json({ message: "Cannot delete the current academic year" });
                return;
            }
        }
        await year.deleteOne();
        await logActivity({
            userId: (req as any).user._id,
            action: `Deleted academic year ${year.name}`,
        });
        res.status(200).json({ message: "Academic Year deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

