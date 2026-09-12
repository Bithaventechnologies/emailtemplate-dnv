"use client";

import { useState } from "react";
import Link from "next/link";
import { useCreateRecipientList, useDeleteRecipientList, useRecipientLists } from "@/hooks/use-recipients";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Menu, DotsIcon } from "@/components/ui/menu";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { getErrorMessage } from "@/hooks/use-api-error";

export default function RecipientListsPage() {
  const { data: lists, isLoading } = useRecipientLists();
  const createList = useCreateRecipientList();
  const deleteList = useDeleteRecipientList();
  const confirm = useConfirm();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function handleCreate() {
    if (!name.trim()) return;
    try {
      await createList.mutateAsync({ name, description: description || undefined });
      toast({ title: "List created", variant: "success" });
      setModalOpen(false);
      setName("");
      setDescription("");
    } catch (error) {
      toast({ title: "Failed to create list", description: getErrorMessage(error), variant: "error" });
    }
  }

  async function handleDelete(id: string, listName: string) {
    const ok = await confirm({
      title: `Delete "${listName}"?`,
      description: "Recipients will remain, but this list and its memberships will be removed.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteList.mutateAsync(id);
      toast({ title: "List deleted", variant: "success" });
    } catch (error) {
      toast({ title: "Failed to delete list", description: getErrorMessage(error), variant: "error" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Recipient lists</h1>
          <p className="mt-1 text-sm text-ink-500">Group recipients for targeted campaigns.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>New list</Button>
      </div>

      <Card>
        {isLoading ? (
          <TableSkeleton rows={3} cols={2} />
        ) : !lists || lists.length === 0 ? (
          <EmptyState
            title="No lists yet"
            description="Create a list to organize recipients for campaigns."
            action={<Button onClick={() => setModalOpen(true)}>New list</Button>}
          />
        ) : (
          <ul className="divide-y divide-ink-100">
            {lists.map((list) => (
              <li key={list.id} className="flex items-center justify-between px-5 py-3">
                <Link href={`/recipients/lists/${list.id}`} className="focus-ring min-w-0 flex-1 rounded">
                  <p className="truncate text-sm font-medium text-ink-900 hover:text-accent-600">{list.name}</p>
                  {list.description ? <p className="truncate text-xs text-ink-500">{list.description}</p> : null}
                </Link>
                <Menu trigger={<DotsIcon />} items={[{ label: "Delete", onClick: () => handleDelete(list.id, list.name), danger: true }]} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New recipient list">
        <div className="space-y-4">
          <div>
            <Label htmlFor="list-name" required>
              Name
            </Label>
            <Input id="list-name" data-autofocus value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="list-description">Description</Label>
            <Input id="list-description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <Button onClick={handleCreate} loading={createList.isPending} disabled={!name.trim()}>
            Create list
          </Button>
        </div>
      </Modal>
    </div>
  );
}
