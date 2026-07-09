import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const MAX_OWNED_GROUPS_PER_USER = 5;

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async createGroup(userId: string, name: string) {
    const ownedCount = await this.prisma.group.count({
      where: { ownerId: userId },
    });

    if (ownedCount >= MAX_OWNED_GROUPS_PER_USER) {
      throw new BadRequestException(
        `Możesz posiadać maksymalnie ${MAX_OWNED_GROUPS_PER_USER} grup.`,
      );
    }

    const group = await this.prisma.group.create({
      data: {
        name,
        ownerId: userId,
        members: {
          create: { userId }, // Właściciel jest automatycznie członkiem
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
      },
    });
    return group;
  }

  async getGroups(userId: string) {
    const groups = await this.prisma.group.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const groupsWithOwnership = groups.map((group) => ({
      ...group,
      isOwner: group.ownerId === userId,
    }));

    return {
      groups: groupsWithOwnership,
      ownedCount: groupsWithOwnership.filter((group) => group.isOwner).length,
      maxOwnedGroups: MAX_OWNED_GROUPS_PER_USER,
    };
  }

  async deleteGroup(userId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });
    if (!group) throw new NotFoundException('Grupa nie istnieje');
    if (group.ownerId !== userId)
      throw new ForbiddenException('Tylko właściciel może usunąć grupę');

    await this.prisma.group.delete({
      where: { id: groupId },
    });

    return { success: true, message: 'Grupa została usunięta' };
  }

  async addMember(userId: string, groupId: string, email: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });
    if (!group) throw new NotFoundException('Grupa nie istnieje');
    if (group.ownerId !== userId)
      throw new ForbiddenException('Tylko właściciel może dodawać członków');

    const userToAdd = await this.prisma.user.findUnique({ where: { email } });
    if (!userToAdd)
      throw new NotFoundException(
        'Nie znaleziono użytkownika o podanym adresie email. Osoba musi zalogować się najpierw do aplikacji.',
      );

    const existingMember = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId, userId: userToAdd.id },
      },
    });

    if (existingMember)
      throw new BadRequestException('Użytkownik jest już w tej grupie');

    const newMember = await this.prisma.groupMember.create({
      data: {
        groupId,
        userId: userToAdd.id,
      },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    return newMember;
  }

  async leaveGroup(userId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });
    if (!group) throw new NotFoundException('Grupa nie istnieje');
    if (group.ownerId === userId)
      throw new BadRequestException(
        'Właściciel nie może opuścić grupy — usuń grupę lub przekaż własność.',
      );

    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId, userId },
      },
    });
    if (!membership)
      throw new NotFoundException('Nie jesteś członkiem tej grupy');

    await this.prisma.groupMember.delete({
      where: { id: membership.id },
    });

    return { success: true, message: 'Opuszczono grupę' };
  }

  async removeMember(userId: string, groupId: string, memberId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });
    if (!group) throw new NotFoundException('Grupa nie istnieje');
    if (group.ownerId !== userId)
      throw new ForbiddenException('Tylko właściciel może usuwać członków');

    const member = await this.prisma.groupMember.findUnique({
      where: { id: memberId },
    });
    if (!member || member.groupId !== groupId)
      throw new NotFoundException('Członek nie należy do tej grupy');

    if (member.userId === group.ownerId)
      throw new BadRequestException('Nie można usunąć właściciela grupy');

    await this.prisma.groupMember.delete({
      where: { id: memberId },
    });

    return { success: true, message: 'Członek został usunięty z grupy' };
  }
}
