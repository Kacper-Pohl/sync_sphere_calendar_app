import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { GroupsService, MAX_OWNED_GROUPS_PER_USER } from './groups.service';
import { PrismaService } from '../prisma/prisma.service';

const OWNER_ID = 'user-owner';
const OTHER_ID = 'user-other';
const GROUP_ID = 'group-1';

const groupOwnedByOwner = { id: GROUP_ID, name: 'Team', ownerId: OWNER_ID };

describe('GroupsService', () => {
  let service: GroupsService;
  let prisma: {
    group: Record<string, jest.Mock>;
    groupMember: Record<string, jest.Mock>;
    user: Record<string, jest.Mock>;
  };

  beforeEach(async () => {
    prisma = {
      group: {
        count: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      groupMember: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      user: { findUnique: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [GroupsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<GroupsService>(GroupsService);
  });

  describe('createGroup', () => {
    it('creates the group and seeds the owner as its first member', async () => {
      prisma.group.count.mockResolvedValue(0);
      prisma.group.create.mockResolvedValue(groupOwnedByOwner);

      await expect(service.createGroup(OWNER_ID, 'Team')).resolves.toEqual(
        groupOwnedByOwner,
      );

      expect(prisma.group.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Team',
            ownerId: OWNER_ID,
            members: { create: { userId: OWNER_ID } },
          }),
        }),
      );
    });

    it('allows creation on the last free slot', async () => {
      prisma.group.count.mockResolvedValue(MAX_OWNED_GROUPS_PER_USER - 1);
      prisma.group.create.mockResolvedValue(groupOwnedByOwner);

      await expect(service.createGroup(OWNER_ID, 'Team')).resolves.toBeDefined();
    });

    it('rejects creation once the ownership limit is reached', async () => {
      prisma.group.count.mockResolvedValue(MAX_OWNED_GROUPS_PER_USER);

      await expect(service.createGroup(OWNER_ID, 'Team')).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.group.create).not.toHaveBeenCalled();
    });

    it('counts only groups the user owns, not ones they belong to', async () => {
      prisma.group.count.mockResolvedValue(0);
      prisma.group.create.mockResolvedValue(groupOwnedByOwner);

      await service.createGroup(OWNER_ID, 'Team');

      expect(prisma.group.count).toHaveBeenCalledWith({
        where: { ownerId: OWNER_ID },
      });
    });
  });

  describe('getGroups', () => {
    it('marks ownership per group and counts only the owned ones', async () => {
      prisma.group.findMany.mockResolvedValue([
        { id: 'a', ownerId: OWNER_ID },
        { id: 'b', ownerId: OTHER_ID },
        { id: 'c', ownerId: OWNER_ID },
      ]);

      const result = await service.getGroups(OWNER_ID);

      expect(result.groups.map((g) => g.isOwner)).toEqual([true, false, true]);
      expect(result.ownedCount).toBe(2);
      expect(result.maxOwnedGroups).toBe(MAX_OWNED_GROUPS_PER_USER);
    });
  });

  describe('deleteGroup', () => {
    it('throws NotFoundException when the group is missing', async () => {
      prisma.group.findUnique.mockResolvedValue(null);

      await expect(service.deleteGroup(OWNER_ID, GROUP_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when the caller is not the owner', async () => {
      prisma.group.findUnique.mockResolvedValue(groupOwnedByOwner);

      await expect(service.deleteGroup(OTHER_ID, GROUP_ID)).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.group.delete).not.toHaveBeenCalled();
    });

    it('deletes the group for its owner', async () => {
      prisma.group.findUnique.mockResolvedValue(groupOwnedByOwner);
      prisma.group.delete.mockResolvedValue(groupOwnedByOwner);

      await expect(service.deleteGroup(OWNER_ID, GROUP_ID)).resolves.toEqual(
        expect.objectContaining({ success: true }),
      );
      expect(prisma.group.delete).toHaveBeenCalledWith({
        where: { id: GROUP_ID },
      });
    });
  });

  describe('addMember', () => {
    it('throws NotFoundException when the group is missing', async () => {
      prisma.group.findUnique.mockResolvedValue(null);

      await expect(
        service.addMember(OWNER_ID, GROUP_ID, 'new@example.com'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when the caller is not the owner', async () => {
      prisma.group.findUnique.mockResolvedValue(groupOwnedByOwner);

      await expect(
        service.addMember(OTHER_ID, GROUP_ID, 'new@example.com'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when nobody has signed in with that email', async () => {
      prisma.group.findUnique.mockResolvedValue(groupOwnedByOwner);
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.addMember(OWNER_ID, GROUP_ID, 'stranger@example.com'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when the user is already a member', async () => {
      prisma.group.findUnique.mockResolvedValue(groupOwnedByOwner);
      prisma.user.findUnique.mockResolvedValue({ id: OTHER_ID });
      prisma.groupMember.findUnique.mockResolvedValue({ id: 'membership-1' });

      await expect(
        service.addMember(OWNER_ID, GROUP_ID, 'other@example.com'),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.groupMember.create).not.toHaveBeenCalled();
    });

    it('adds a member that exists and is not in the group yet', async () => {
      prisma.group.findUnique.mockResolvedValue(groupOwnedByOwner);
      prisma.user.findUnique.mockResolvedValue({ id: OTHER_ID });
      prisma.groupMember.findUnique.mockResolvedValue(null);
      prisma.groupMember.create.mockResolvedValue({ id: 'membership-2' });

      await expect(
        service.addMember(OWNER_ID, GROUP_ID, 'other@example.com'),
      ).resolves.toEqual({ id: 'membership-2' });

      expect(prisma.groupMember.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { groupId: GROUP_ID, userId: OTHER_ID },
        }),
      );
    });
  });

  describe('leaveGroup', () => {
    it('throws NotFoundException when the group is missing', async () => {
      prisma.group.findUnique.mockResolvedValue(null);

      await expect(service.leaveGroup(OTHER_ID, GROUP_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('refuses to let the owner leave their own group', async () => {
      prisma.group.findUnique.mockResolvedValue(groupOwnedByOwner);

      await expect(service.leaveGroup(OWNER_ID, GROUP_ID)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.groupMember.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the caller is not a member', async () => {
      prisma.group.findUnique.mockResolvedValue(groupOwnedByOwner);
      prisma.groupMember.findUnique.mockResolvedValue(null);

      await expect(service.leaveGroup(OTHER_ID, GROUP_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('removes the membership of a non-owner member', async () => {
      prisma.group.findUnique.mockResolvedValue(groupOwnedByOwner);
      prisma.groupMember.findUnique.mockResolvedValue({ id: 'membership-1' });
      prisma.groupMember.delete.mockResolvedValue({ id: 'membership-1' });

      await expect(service.leaveGroup(OTHER_ID, GROUP_ID)).resolves.toEqual(
        expect.objectContaining({ success: true }),
      );
      expect(prisma.groupMember.delete).toHaveBeenCalledWith({
        where: { id: 'membership-1' },
      });
    });
  });

  describe('removeMember', () => {
    it('throws ForbiddenException when the caller is not the owner', async () => {
      prisma.group.findUnique.mockResolvedValue(groupOwnedByOwner);

      await expect(
        service.removeMember(OTHER_ID, GROUP_ID, 'membership-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when the membership belongs to another group', async () => {
      prisma.group.findUnique.mockResolvedValue(groupOwnedByOwner);
      prisma.groupMember.findUnique.mockResolvedValue({
        id: 'membership-1',
        groupId: 'some-other-group',
        userId: OTHER_ID,
      });

      await expect(
        service.removeMember(OWNER_ID, GROUP_ID, 'membership-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('refuses to remove the owner from their own group', async () => {
      prisma.group.findUnique.mockResolvedValue(groupOwnedByOwner);
      prisma.groupMember.findUnique.mockResolvedValue({
        id: 'membership-owner',
        groupId: GROUP_ID,
        userId: OWNER_ID,
      });

      await expect(
        service.removeMember(OWNER_ID, GROUP_ID, 'membership-owner'),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.groupMember.delete).not.toHaveBeenCalled();
    });

    it('removes a regular member', async () => {
      prisma.group.findUnique.mockResolvedValue(groupOwnedByOwner);
      prisma.groupMember.findUnique.mockResolvedValue({
        id: 'membership-1',
        groupId: GROUP_ID,
        userId: OTHER_ID,
      });
      prisma.groupMember.delete.mockResolvedValue({ id: 'membership-1' });

      await expect(
        service.removeMember(OWNER_ID, GROUP_ID, 'membership-1'),
      ).resolves.toEqual(expect.objectContaining({ success: true }));
    });
  });
});
