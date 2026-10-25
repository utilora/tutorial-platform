export type ActionState = { ok?: boolean; error?: string; resetUrl?: string };
export const text = (form: FormData, key: string) => String(form.get(key) || "");
export const checked = (form: FormData, key: string) => form.get(key) === "on";
