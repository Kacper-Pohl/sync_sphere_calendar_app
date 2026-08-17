import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleAuthService } from '../google/google-auth.service';

const INVITEE_ID = 'user-invitee';
const OTHER_ID = 'user-other';
const INVITATION_ID = 'invitation-1';

describe('InvitationsService', () => {
  let service: InvitationsService;
  let prisma: { eventInvitation: Record<string, jest.Mock> };
  let googleAuth: { getOAuthClient: jest.Mock };

  beforeEach(async () => {
    prisma = {
      eventInvitation: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
    };
    googleAuth = { getOAuthClient: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: GoogleAuthService, useValue: googleAuth },
      ],
    }).compile();

    service = module.get<InvitationsService>(InvitationsService);
  });

  describe('getPendingInvitations', () => {
    it('queries only invitations addressed to the user and still pending', async () => {
      prisma.eventInvitation.findMany.mockResolvedValue([]);

      await service.getPendingInvitations(INVITEE_ID);

      expect(prisma.eventInvitation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { inviteeId: INVITEE_ID, status: 'PENDING' },
        }),
      );
    });
  });

  // Every guard below runs before the Google Calendar call, so a rejected
  // invitation never reaches the API — asserted via getOAuthClient.
  describe('acceptInvitation guards', () => {
    it('throws NotFoundException when the invitation does not exist', async () => {
      prisma.eventInvitation.findUnique.mockResolvedValue(null);

      await expect(
        service.acceptInvitation(INVITEE_ID, INVITATION_ID),
      ).rejects.toThrow(NotFoundException);
      expect(googleAuth.getOAuthClient).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when the invitation belongs to someone else', async () => {
      prisma.eventInvitation.findUnique.mockResolvedValue({
        id: INVITATION_ID,
        inviteeId: OTHER_ID,
        status: 'PENDING',
        event: {},
      });

      await expect(
        service.acceptInvitation(INVITEE_ID, INVITATION_ID),
      ).rejects.toThrow(ForbiddenException);
      expect(googleAuth.getOAuthClient).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when the invitation was already answered', async () => {
      prisma.eventInvitation.findUnique.mockResolvedValue({
        id: INVITATION_ID,
        inviteeId: INVITEE_ID,
        status: 'ACCEPTED',
        event: {},
      });

      await expect(
        service.acceptInvitation(INVITEE_ID, INVITATION_ID),
      ).rejects.toThrow(BadRequestException);
      expect(googleAuth.getOAuthClient).not.toHaveBeenCalled();
    });
  });

  describe('declineInvitation', () => {
    it('declines a pending invitation addressed to the caller', async () => {
      prisma.eventInvitation.updateMany.mockResolvedValue({ count: 1 });

      await expect(
        service.declineInvitation(INVITEE_ID, INVITATION_ID),
      ).resolves.toEqual(expect.objectContaining({ success: true }));

      expect(prisma.eventInvitation.updateMany).toHaveBeenCalledWith({
        where: {
          id: INVITATION_ID,
          inviteeId: INVITEE_ID,
          status: 'PENDING',
        },
        data: { status: 'DECLINED' },
      });
    });

    it('throws NotFoundException when nothing matched and the invitation is gone', async () => {
      prisma.eventInvitation.updateMany.mockResolvedValue({ count: 0 });
      prisma.eventInvitation.findUnique.mockResolvedValue(null);

      await expect(
        service.declineInvitation(INVITEE_ID, INVITATION_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when the invitation belongs to someone else', async () => {
      prisma.eventInvitation.updateMany.mockResolvedValue({ count: 0 });
      prisma.eventInvitation.findUnique.mockResolvedValue({
        id: INVITATION_ID,
        inviteeId: OTHER_ID,
        status: 'PENDING',
      });

      await expect(
        service.declineInvitation(INVITEE_ID, INVITATION_ID),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException when the invitation was already answered', async () => {
      prisma.eventInvitation.updateMany.mockResolvedValue({ count: 0 });
      prisma.eventInvitation.findUnique.mockResolvedValue({
        id: INVITATION_ID,
        inviteeId: INVITEE_ID,
        status: 'DECLINED',
      });

      await expect(
        service.declineInvitation(INVITEE_ID, INVITATION_ID),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
