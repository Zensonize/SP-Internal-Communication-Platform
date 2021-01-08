import { Chat } from "./chat.interface";
import { ChatService } from "./chat.service";
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    getmsg(): Promise<Chat[]>;
    putmsg(newMessage: Chat): Promise<Chat>;
}
