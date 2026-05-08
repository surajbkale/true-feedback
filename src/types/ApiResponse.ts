import { IMessage } from "@/model/Message";

export interface ApiResponse {
  success: boolean;
  message: string;
  isAcceptingMessages?: boolean;
  messages?: Array<IMessage>;
}
