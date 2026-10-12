"use client";

import type { ComponentProps } from "react";

export function ConfirmSubmit({
  message,
  ...props
}: ComponentProps<"button"> & { message: string }) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      {...props}
    />
  );
}
