import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "super_admin") {
      return NextResponse.json({ error: "Only Super Admin can edit admins" }, { status: 403 });
    }

    const { id } = await params;
    const { name, email, password, role } = await req.json();

    await connectToDatabase();

    const userToUpdate = await User.findById(id);
    if (!userToUpdate) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    if (name) userToUpdate.name = name;
    if (email) userToUpdate.email = email;
    if (role) userToUpdate.role = role;
    if (password) {
      userToUpdate.password = await bcrypt.hash(password, 10);
    }

    await userToUpdate.save();

    const updatedUser = userToUpdate.toObject();
    delete (updatedUser as any).password;

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "super_admin") {
      return NextResponse.json({ error: "Only Super Admin can delete admins" }, { status: 403 });
    }

    const { id } = await params;

    if ((session.user as any).id === id) {
      return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
    }

    await connectToDatabase();

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
