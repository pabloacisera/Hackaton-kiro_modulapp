import {
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { JwtService } from '../../infrastructure/auth/jwt/jwt.service';
import { NotificationsService } from './notifications.service';
import { AdminNotification } from './domain/admin-notification.entity';

/**
 * TASK-notif-3: WebSocket gateway with JWT auth on handshake.
 * Emits `notification.new` to all connected admins.
 * Handles `notification.mark_read` events from clients.
 */
@WebSocketGateway({
  namespace: '/admin',
  cors: { origin: '*' },
})
@Injectable()
export class NotificationsGateway implements OnGatewayInit, OnModuleInit {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly notificationsService: NotificationsService,
  ) {}

  onModuleInit(): void {
    this.notificationsService.registerBroadcast((n) => this.broadcast(n));
  }

  afterInit(_server: Server): void {
    this.logger.log('WebSocket gateway initialized');
  }

  // ── JWT auth on connect ────────────────────────────────────────────────────

  async handleConnection(client: Socket): Promise<void> {
    const token =
      (client.handshake.auth?.token as string | undefined) ??
      (client.handshake.headers.authorization?.split(' ')[1]);

    if (!token) {
      this.logger.warn(`Client ${client.id} disconnected: no token`);
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwtService.verifyAccessToken(token);
      (client as any).adminUser = payload;
      this.logger.log(`Admin ${payload.email} connected [${client.id}]`);

      // Send unread notifications on connect
      const unread = await this.notificationsService.findUnread();
      client.emit('notifications.unread', unread);
    } catch {
      this.logger.warn(`Client ${client.id} rejected: invalid token`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client ${client.id} disconnected`);
  }

  // ── Mark read ─────────────────────────────────────────────────────────────

  @SubscribeMessage('notification.mark_read')
  async handleMarkRead(
    @MessageBody() data: { id: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const updated = await this.notificationsService.markRead(data.id);
    if (updated) {
      // Propagate to all connected admins (multi-tab sync)
      this.server.emit('notification.marked_read', { id: updated.id });
    }
  }

  // ── Broadcast to all admins ───────────────────────────────────────────────

  broadcast(notification: AdminNotification): void {
    this.server?.emit('notification.new', notification);
  }
}
