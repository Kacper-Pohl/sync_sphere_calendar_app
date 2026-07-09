export interface GroupMemberUser {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
}

export interface GroupMember {
  id: string;
  userId: string;
  user: GroupMemberUser;
}

export interface Group {
  id: string;
  name: string;
  ownerId: string;
  isOwner?: boolean;
  members?: GroupMember[];
}

export interface GroupsListResponse {
  groups: Group[];
  ownedCount: number;
  maxOwnedGroups: number;
}
