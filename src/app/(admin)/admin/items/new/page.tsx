import { ItemForm } from "../item-form";
import { createItemAction } from "../actions";

export default function NewItemPage() {
  return (
    <ItemForm action={createItemAction} heading="New item" submitLabel="Create" />
  );
}
