"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const chat_service_1 = require("./chat/chat.service");
let AppGateway = class AppGateway {
    constructor(chatService) {
        this.chatService = chatService;
        this.users = 0;
        this.logger = new common_1.Logger('AppGateway');
    }
    async handleMessage(client, payload) {
        const chatObject = {
            msg: payload,
            username: client.id
        };
        console.log(client, chatObject);
        const newMessage = await this.chatService.addNewMessage(chatObject);
        this.logger.debug(newMessage);
        this.server.emit('msg', newMessage);
    }
    afterInit(server) {
        this.logger.log('Mongo DB Connected');
    }
    handleConnection(client, payload) {
        this.users++;
        this.server.emit('userOnline', this.users);
        this.logger.log(`User connect ${client.id}`);
    }
    handleDisconnect() {
        this.users--;
        this.server.emit('userLeft', this.users);
    }
};
__decorate([
    websockets_1.WebSocketServer(),
    __metadata("design:type", Object)
], AppGateway.prototype, "server", void 0);
__decorate([
    websockets_1.SubscribeMessage('msg'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "handleMessage", null);
AppGateway = __decorate([
    websockets_1.WebSocketGateway(),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], AppGateway);
exports.AppGateway = AppGateway;
//# sourceMappingURL=app.gateway.js.map