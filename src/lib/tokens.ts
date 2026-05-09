export const color = {
  cream: "#FEFFF8",
  ink: "#0A0A0A",
  mute: "rgba(10, 10, 10, 0.5)",
  line: "rgba(10, 10, 10, 0.12)",
  overlayInk: "rgba(10, 10, 10, 0.30)",
} as const;

export const easing = {
  soft: [0.22, 1, 0.36, 1] as const,
  firm: [0.65, 0, 0.35, 1] as const,
} as const;

export const duration = {
  snap: 0.15,
  soft: 0.35,
  medium: 0.6,
  long: 1.0,
} as const;
