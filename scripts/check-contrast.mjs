const palettes = {
  light: {
    bg: "#DDEEF0",
    bgSoft: "#C9E3E6",
    surface: "#F4FAFA",
    ink: "#08333F",
    muted: "#3C6570",
    teal: "#127986",
    ocean: "#0B3D4A",
    coral: "#F2795B",
    coralText: "#8F2F1C",
    coralSoft: "#F9CDBF",
  },
  dark: {
    bg: "#061A20",
    bgSoft: "#0A252D",
    surface: "#0E2F38",
    ink: "#E3F3F4",
    muted: "#9CC0C6",
    teal: "#3CB8C6",
    ocean: "#04141A",
    coral: "#FF8A6B",
    coralText: "#FFB09A",
    coralSoft: "#4A2A22",
  },
};

function channel(hex, offset) {
  const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  return 0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);
}

function ratio(foreground, background) {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

const failures = [];
for (const [mode, palette] of Object.entries(palettes)) {
  for (const [name, background] of Object.entries({
    page: palette.bg,
    alternate: palette.bgSoft,
    card: palette.surface,
  })) {
    for (const [foregroundName, foreground] of [["text", palette.ink], ["muted text", palette.muted]]) {
      const contrast = ratio(foreground, background);
      if (contrast < 4.5) failures.push(`${mode} ${foregroundName} on ${name}: ${contrast.toFixed(2)}:1`);
    }
    const deepText = mode === "light" ? "#F4FAFA" : "#E3F3F4";
    const deepMuted = mode === "light" ? "#AFD2D6" : "#9CC0C6";
    for (const [name, foreground] of [["text", deepText], ["muted text", deepMuted]]) {
      const contrast = ratio(foreground, palette.ocean);
      if (contrast < 4.5) failures.push(`${mode} ${name} on deep band: ${contrast.toFixed(2)}:1`);
    }
  }

  const buttonText = mode === "light" ? "#FFFFFF" : palette.bg;
  const buttonContrast = ratio(buttonText, palette.teal);
  if (buttonContrast < 4.5) failures.push(`${mode} button text on teal: ${buttonContrast.toFixed(2)}:1`);

  const coralContrast = ratio(mode === "light" ? "#08333F" : "#061A20", palette.coral);
  if (coralContrast < 4.5) failures.push(`${mode} dark text on coral: ${coralContrast.toFixed(2)}:1`);
  for (const [backgroundName, background] of [["page", palette.bg], ["alternate", palette.bgSoft], ["card", palette.surface], ["coral-soft", palette.coralSoft]]) {
    const contrast = ratio(palette.coralText, background);
    if (contrast < 4.5) failures.push(`${mode} accessible coral text on ${backgroundName}: ${contrast.toFixed(2)}:1`);
  }
}

if (failures.length) {
  console.error(`Contrast check failed:\n${failures.map((failure) => `- ${failure}`).join("\n")}`);
  process.exitCode = 1;
} else {
  console.log("Ocean theme text, button and coral pairs meet WCAG AA (4.5:1).");
}
