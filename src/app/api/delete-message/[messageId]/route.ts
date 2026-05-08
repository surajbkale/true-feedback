import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { User } from "next-auth";
import MessageModel from "@/model/Message";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const { messageId } = await params;
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
    // Only delete if the message belongs to this user (prevents deleting others' messages)
    const result = await MessageModel.findOneAndDelete({
      _id: messageId,
      userId: _user._id,
    });

    if (!result) {
      return Response.json(
        { success: false, message: "Message not found or already deleted" },
        { status: 404 }
      );
    }

    return Response.json(
      { success: true, message: "Message deleted" },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error deleting message: ${error}`);
    return Response.json(
      { success: false, message: "Error deleting message" },
      { status: 500 }
    );
  }
}
