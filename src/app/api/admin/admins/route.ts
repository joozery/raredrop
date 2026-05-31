import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    
    const adminCount = await User.countDocuments({ role: { $in: ["admin", "super_admin"] } });

    const session = await getServerSession(authOptions);
    if (adminCount > 0) {
      if (!session || !["admin", "super_admin"].includes((session.user as any).role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Fetch all admins and super_admins
    const admins = await User.find({ role: { $in: ["admin", "super_admin"] } }).select("-password").sort({ createdAt: -1 });
    return NextResponse.json(admins);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    // Check if any admin exists
    const adminCount = await User.countDocuments({ role: { $in: ["admin", "super_admin"] } });
    
    const session = await getServerSession(authOptions);
    
    // Only super_admin can create new admins, EXCEPT when there are no admins in the system
    if (adminCount > 0) {
      if (!session || (session.user as any).role !== "super_admin") {
        return NextResponse.json({ error: "Only Super Admin can create new admins" }, { status: 403 });
      }
    }

    const { email, password, name, role } = await req.json();
    
    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newAdmin = await User.create({
      email,
      password: hashedPassword,
      name,
      role: role || "admin"
    });

    const adminWithoutPassword = newAdmin.toObject();
    delete adminWithoutPassword.password;

    return NextResponse.json(adminWithoutPassword, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
