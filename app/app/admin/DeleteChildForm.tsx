"use client";

import { deleteChild } from "./actions";

// Client component so the destructive-delete confirm() can use an onSubmit handler
// (event handlers can't be passed from a server component).
export function DeleteChildForm({ personId }: { personId: string }) {
  return (
    <form
      action={deleteChild}
      style={{ display: "inline" }}
      onSubmit={(e) => {
        if (!confirm("Permanently delete all data for this child? This can't be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="personId" value={personId} />
      <button className="btn btn-ghost" type="submit" style={{ color: "#E85C47" }}>
        Delete
      </button>
    </form>
  );
}
