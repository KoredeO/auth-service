import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from 'src/auth/ws-jwt.guard';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

interface TaskRoom {
  taskId: string;
  users: Set<string>;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private taskRooms: Map<string, TaskRoom> = new Map();
  private userSockets: Map<string, Set<string>> = new Map();

  @UseGuards(WsJwtGuard)
  async handleConnection(@ConnectedSocket() client: Socket) {
    const userId = client.data.user._id;
    this.addUserSocket(userId.toString(), client.id);
    client.emit('connected', { status: 'connected' });
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = client.data?.user?._id;
    if (userId) {
      this.removeUserSocket(userId.toString(), client.id);
    }
  }

  @SubscribeMessage('joinTask')
  async handleJoinTask(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { taskId: string },
  ) {
    const userId = client.data.user._id;
    const roomId = `task:${data.taskId}`;
    
    await client.join(roomId);
    this.addUserToTaskRoom(data.taskId, userId.toString());
    
    const users = this.getTaskRoomUsers(data.taskId);
    this.server.to(roomId).emit('userJoined', {
      taskId: data.taskId,
      userId: userId.toString(),
      activeUsers: Array.from(users),
    });
  }

  @SubscribeMessage('leaveTask')
  async handleLeaveTask(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { taskId: string },
  ) {
    const userId = client.data.user._id;
    const roomId = `task:${data.taskId}`;
    
    await client.leave(roomId);
    this.removeUserFromTaskRoom(data.taskId, userId.toString());
    
    const users = this.getTaskRoomUsers(data.taskId);
    this.server.to(roomId).emit('userLeft', {
      taskId: data.taskId,
      userId: userId.toString(),
      activeUsers: Array.from(users),
    });
  }

  @SubscribeMessage('taskUpdate')
  async handleTaskUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { taskId: string; update: any },
  ) {
    const roomId = `task:${data.taskId}`;
    this.server.to(roomId).emit('taskUpdated', {
      taskId: data.taskId,
      update: data.update,
      userId: client.data.user._id,
    });
  }

  @SubscribeMessage('newComment')
  async handleNewComment(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { taskId: string; comment: any },
  ) {
    const roomId = `task:${data.taskId}`;
    this.server.to(roomId).emit('commentAdded', {
      taskId: data.taskId,
      comment: data.comment,
      userId: client.data.user._id,
    });
  }

  // Helper methods for managing rooms and users
  private addUserToTaskRoom(taskId: string, userId: string) {
    if (!this.taskRooms.has(taskId)) {
      this.taskRooms.set(taskId, { taskId, users: new Set() });
    }
    const room = this.taskRooms.get(taskId);
    if (room) {
      room.users.add(userId);
    }
  }

  private removeUserFromTaskRoom(taskId: string, userId: string) {
    const room = this.taskRooms.get(taskId);
    if (room) {
      room.users.delete(userId);
      if (room.users.size === 0) {
        this.taskRooms.delete(taskId);
      }
    }
  }

  private getTaskRoomUsers(taskId: string): Set<string> {
    return this.taskRooms.get(taskId)?.users || new Set();
  }

  private addUserSocket(userId: string, socketId: string) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.add(socketId);
    }
  }

  private removeUserSocket(userId: string, socketId: string) {
    const userSockets = this.userSockets.get(userId);
    if (userSockets) {
      userSockets.delete(socketId);
      if (userSockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }
}
