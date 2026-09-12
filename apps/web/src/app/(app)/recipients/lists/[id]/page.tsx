"use client";

import { useParams, useRouter } from "next/navigation";
import { useRecipientList } from "@/hooks/use-recipients";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function RecipientListDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: list, isLoading, isError } = useRecipientList(params.id);

  if (isLoading) return <Skeleton className="h-48 max-w-lg" />;
  if (isError || !list) {
    return (
      <Card>
        <EmptyState title="List not found" />
      </Card>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">{list.name}</h1>
          {list.description ? <p className="mt-1 text-sm text-ink-500">{list.description}</p> : null}
        </div>
        <Button variant="outline" onClick={() => router.push("/recipients/lists")}>
          Back to lists
        </Button>
      </div>

      <Card>
        <CardHeader title="Add recipients to this list" description="Import a CSV and choose this list as the target, or add members from the recipients page." />
        <CardBody>
          <Link href="/recipients/import">
            <Button variant="outline">Import CSV into this list</Button>
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}
