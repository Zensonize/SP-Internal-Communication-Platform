import { TimelyDocument } from 'src/chat/TimelyDocument';
export declare type Chat = ChatDTO & TimelyDocument;
export interface ChatDTO {
    username: string;
    msg: string;
}
