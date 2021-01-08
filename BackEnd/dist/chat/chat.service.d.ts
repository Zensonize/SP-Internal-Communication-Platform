import { Model } from "mongoose";
import { Chat, ChatDTO } from "./chat.interface";
export declare class ChatService {
    private readonly chatModel;
    constructor(chatModel: Model<Chat>);
    getAll(): Promise<Array<Chat>>;
    addNewMessage(chat: Chat | ChatDTO): Promise<Chat>;
}
