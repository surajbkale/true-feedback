import dbConnect from "@/lib/dbConnect";
import MessageModel from "@/model/Message";
import UserModel from "@/model/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/options";
import { User } from "next-auth";

export async function GET() {
  await dbConnect();
  const session = await getServerSession(authOptions);
  const _user: User = session?.user;

  if (!session || !_user) {
    return Response.json(
      { success: false, message: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    // Verify the user exists
    const user = await UserModel.findById(_user._id).lean();
    if (!user) {
      return Response.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const messages = await MessageModel.find({ userId: _user._id })
      .sort({ createdAt: -1 })
      .lean();

    return Response.json(
      { success: true, messages },
      { status: 200 }
    );
  } catch (error) {
    console.error(`An unexpected error occurred: ${error}`);
    return Response.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
