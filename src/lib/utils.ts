type ClassValue = string | number | null | false | undefined | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  return inputs
    .flat(Infinity as 1)
    .filter((v): v is string | number => v !== false && v != null && v !== "")
    .join(" ");
}
