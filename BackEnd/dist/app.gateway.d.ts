import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { ChatService } from './chat/chat.service';
import { ChatDTO } from './chat/chat.interface';
export declare class AppGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly chatService;
    server: Server;
    users: number;
    private logger;
    constructor(chatService: ChatService);
    handleMessage(client: Socket, payload: ChatDTO['msg']): Promise<void>;
    afterInit(server: Server): void;
    handleConnection(client: Socket, payload: string): void;
    handleDisconnect(): void;
}
