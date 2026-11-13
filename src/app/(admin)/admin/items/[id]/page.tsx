import { notFound } from "next/navigation";

import { requireOwner } from "@/lib/auth";
import { itemToFormDefaults } from "@/lib/content/item-form";
import { getItemForAdmin } from "@/db/admin";

import { deleteItemAction, updateItemAction } from "../actions";
import { ItemForm } from "../item-form";

export default async function EditItemPage({
  params,
}: PageProps<"/admin/items/[id]">) {
  await requireOwner();

  const { id } = await params;
  const entry = await getItemForAdmin(id);
  if (!entry) notFound();

  return (
    <div>
      <ItemForm
        action={updateItemAction}
        defaults={itemToFormDefaults(entry)}
        itemId={entry.id}
        heading={entry.title}
        submitLabel="Save changes"
      />

      <form action={deleteItemAction} className="mt-10 max-w-3xl border-t border-line/60 pt-6">
        <input type="hidden" name="id" value={entry.id} />
        <p className="text-sm text-fg-muted">
          Deleting removes the item and its links and bullets. This cannot be undone.
        </p>
        <button
          type="submit"
          className="mt-4 border border-line px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-fg-muted transition-colors hover:border-accent hover:text-accent"
        >
          Delete item
        </button>
      </form>
    </div>
  );
}
