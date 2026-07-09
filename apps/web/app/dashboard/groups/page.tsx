'use client';

import { useState } from 'react';
import { mutate } from 'swr';
import { useAuthenticatedSWR } from '@/lib/use-authenticated-swr';
import { getApiErrorMessage } from '@/lib/api-error';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Users, Plus, UserPlus, Trash2, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import type { Group, GroupsListResponse } from '@/lib/types/groups';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function GroupsPage() {
  const { token } = useAuth();
  const { data, isPageLoading, showError } = useAuthenticatedSWR<GroupsListResponse>(
    `${API_URL}/groups`,
  );
  const groups = data?.groups;
  const ownedCount = data?.ownedCount ?? 0;
  const maxOwnedGroups = data?.maxOwnedGroups ?? 5;
  const [newGroupName, setNewGroupName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null);
  const [leaveTarget, setLeaveTarget] = useState<Group | null>(null);

  const canCreateGroup = ownedCount < maxOwnedGroups;

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      const res = await fetch(`${API_URL}/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newGroupName.trim() }),
      });

      if (!res.ok) {
        throw new Error(await getApiErrorMessage(res, 'Nie udało się utworzyć grupy'));
      }

      toast.success('Grupa utworzona!');
      setNewGroupName('');
      setCreateDialogOpen(false);
      mutate(`${API_URL}/groups`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Nie udało się utworzyć grupy');
    }
  };

  const handleAddMember = async (e: React.FormEvent, groupId: string) => {
    e.preventDefault();
    if (!newMemberEmail) return;

    try {
      const res = await fetch(`${API_URL}/groups/${groupId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: newMemberEmail }),
      });

      if (!res.ok) {
        throw new Error(await getApiErrorMessage(res, 'Nie udało się dodać użytkownika'));
      }

      toast.success('Użytkownik dodany!');
      setNewMemberEmail('');
      setActiveGroup(null);
      mutate(`${API_URL}/groups`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Nie udało się dodać użytkownika');
    }
  };

  const handleLeaveGroup = async () => {
    if (!leaveTarget) return;

    try {
      const res = await fetch(`${API_URL}/groups/${leaveTarget.id}/leave`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(await getApiErrorMessage(res, 'Nie udało się opuścić grupy'));
      }

      toast.success('Opuszczono grupę');
      setLeaveTarget(null);
      mutate(`${API_URL}/groups`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Nie udało się opuścić grupy');
    }
  };

  const handleDeleteGroup = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`${API_URL}/groups/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(await getApiErrorMessage(res, 'Nie udało się usunąć grupy'));
      }

      toast.success('Grupa usunięta!');
      setDeleteTarget(null);
      mutate(`${API_URL}/groups`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Nie udało się usunąć grupy');
    }
  };

  const handleRemoveMember = async (groupId: string, memberId: string, memberName: string) => {
    if (!confirm(`Usunąć użytkownika „${memberName}” z grupy?`)) return;

    try {
      const res = await fetch(`${API_URL}/groups/${groupId}/members/${memberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(await getApiErrorMessage(res, 'Nie udało się usunąć użytkownika'));
      }

      toast.success('Użytkownik usunięty z grupy');
      mutate(`${API_URL}/groups`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Nie udało się usunąć użytkownika');
    }
  };

  if (isPageLoading)
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-emerald-500"></div>
        <p className="animate-pulse text-xs uppercase tracking-widest text-slate-500">
          Ładowanie grup...
        </p>
      </div>
    );

  if (showError)
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
        <p className="text-sm text-muted-foreground">Nie udało się załadować grup.</p>
        <Button variant="outline" size="sm" onClick={() => mutate(`${API_URL}/groups`)}>
          Spróbuj ponownie
        </Button>
      </div>
    );

  return (
    <div data-testid="groups-page" className="flex h-full flex-col space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Twoje Grupy</h2>
          <p className="text-muted-foreground">Zarządzaj zespołami i znajomymi.</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
            Twoje grupy: {ownedCount}/{maxOwnedGroups}
          </span>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button
                data-testid="group-create-trigger"
                size="sm"
                className="gap-2"
                disabled={!canCreateGroup}
              >
                <Plus className="h-4 w-4" />
                Nowa grupa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form data-testid="group-create-form" onSubmit={handleCreateGroup}>
                <DialogHeader>
                  <DialogTitle>Utwórz nową grupę</DialogTitle>
                  <DialogDescription>
                    Podaj nazwę zespołu. Możesz posiadać maksymalnie {maxOwnedGroups} grup.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Input
                    data-testid="group-name-input"
                    type="text"
                    placeholder="Nazwa grupy"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    autoFocus
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Anuluj
                  </Button>
                  <Button data-testid="group-create-submit" type="submit" disabled={!newGroupName.trim()}>
                    Utwórz
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!canCreateGroup && (
        <p className="text-sm text-muted-foreground">
          Osiągnięto limit {maxOwnedGroups} grup. Usuń jedną z własnych grup, aby utworzyć nową.
        </p>
      )}

      <div className="space-y-4">
        {groups?.map((group) => {
          const isOwner = group.isOwner ?? false;

          return (
            <Card
              data-testid={`group-card-${group.id}`}
              key={group.id}
              className="overflow-hidden bg-card/60 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between border-b border-primary/20 bg-primary/10 p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 data-testid="group-name" className="text-lg font-semibold">
                    {group.name}
                  </h3>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-xs text-muted-foreground">
                    Członkowie: {group.members?.length || 0}
                  </div>
                  {isOwner ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setDeleteTarget(group)}
                      title="Usuń grupę"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      data-testid={`group-leave-trigger-${group.id}`}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      onClick={() => setLeaveTarget(group)}
                      title="Opuść grupę"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <CardContent className="p-0">
                <div className="space-y-3 p-4">
                  {group.members?.map((member) => {
                    const isGroupOwner = group.ownerId === member.userId;

                    return (
                      <div
                        data-testid={`group-member-${member.id}`}
                        key={member.id}
                        className="flex items-center gap-3 rounded-md bg-background/30 p-2"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                          {member.user.name?.[0] || member.user.email[0].toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium">
                            {member.user.name || 'Użytkownik'}
                          </div>
                          <div className="text-xs text-muted-foreground">{member.user.email}</div>
                        </div>
                        {isGroupOwner ? (
                          <div className="rounded bg-primary/20 px-2 py-1 text-xs text-primary">
                            Właściciel
                          </div>
                        ) : (
                          isOwner && (
                            <Button
                              data-testid={`group-remove-member-${member.id}`}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() =>
                                handleRemoveMember(
                                  group.id,
                                  member.id,
                                  member.user.name || member.user.email,
                                )
                              }
                              title="Usuń z grupy"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>

                {isOwner && (
                  <div className="border-t border-border/50 bg-muted/20 p-4">
                    {activeGroup === group.id ? (
                      <form
                        data-testid="group-add-member-form"
                        onSubmit={(e) => handleAddMember(e, group.id)}
                        className="flex flex-wrap gap-2"
                      >
                        <Input
                          data-testid="group-member-email-input"
                          type="email"
                          placeholder="Email użytkownika"
                          value={newMemberEmail}
                          onChange={(e) => setNewMemberEmail(e.target.value)}
                          className="min-w-[200px] flex-1"
                          autoFocus
                        />
                        <Button type="submit" size="sm">
                          Dodaj
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveGroup(null)}
                        >
                          Anuluj
                        </Button>
                      </form>
                    ) : (
                      <Button
                        data-testid="group-add-member-trigger"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => setActiveGroup(group.id)}
                      >
                        <UserPlus className="h-4 w-4" /> Dodaj członka
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {groups?.length === 0 && (
          <div className="rounded-lg border border-dashed border-border/60 p-8 text-center text-muted-foreground">
            <p className="mb-3">Nie należysz jeszcze do żadnej grupy.</p>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => setCreateDialogOpen(true)}
              disabled={!canCreateGroup}
            >
              <Plus className="h-4 w-4" />
              Utwórz pierwszą grupę
            </Button>
          </div>
        )}
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Usunąć grupę?</DialogTitle>
            <DialogDescription>
              Grupa „{deleteTarget?.name}” zostanie trwale usunięta wraz ze wszystkimi członkami.
              Tej operacji nie można cofnąć.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Anuluj
            </Button>
            <Button variant="destructive" onClick={handleDeleteGroup}>
              Usuń grupę
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!leaveTarget} onOpenChange={(open) => !open && setLeaveTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Opuścić grupę?</DialogTitle>
            <DialogDescription>
              Nie będziesz już widzieć grupy „{leaveTarget?.name}” ani jej członków. Właściciel
              grupy nadal będzie mógł Cię ponownie dodać.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveTarget(null)}>
              Anuluj
            </Button>
            <Button data-testid="group-leave-confirm" onClick={handleLeaveGroup}>
              Opuść grupę
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
