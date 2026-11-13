"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOwner } from "@/lib/auth";
import { parseItemForm } from "@/lib/content/item-form";
import { deleteItem, saveItem } from "@/db/admin-write";

export type ItemActionState = { errors: string[] };

function revalidateContent(slug?: string) {
  revalidatePath("/", "layout");
  if (slug) revalidatePath(`/projects/${slug}`);
}

export async function createItemAction(
  _previous: ItemActionState,
  formData: FormData,
): Promise<ItemActionState> {
  await requireOwner();

  const parsed = parseItemForm(formData);
  if (!parsed.ok) return { errors: parsed.errors };

  try {
    await saveItem(parsed.item);
  } catch (error) {
    return {
      errors: [
        error instanceof Error
          ? `Could not save: ${error.message}`
          : "Could not save this item.",
      ],
    };
  }

  revalidateContent(parsed.item.slug);
  redirect(`/admin/items/${parsed.item.id}`);
}

export async function updateItemAction(
  _previous: ItemActionState,
  formData: FormData,
): Promise<ItemActionState> {
  await requireOwner();

  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { errors: ["Unknown item."] };

  const parsed = parseItemForm(formData, id);
  if (!parsed.ok) return { errors: parsed.errors };

  try {
    await saveItem(parsed.item);
  } catch (error) {
    return {
      errors: [
        error instanceof Error
          ? `Could not save: ${error.message}`
          : "Could not save this item.",
      ],
    };
  }

  revalidateContent(parsed.item.slug);
  redirect(`/admin/items/${id}`);
}

export async function deleteItemAction(formData: FormData): Promise<void> {
  await requireOwner();

  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect("/admin");

  await deleteItem(id);
  revalidatePath("/", "layout");
  redirect("/admin");
}
