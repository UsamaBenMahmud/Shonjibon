import { readFile } from "node:fs/promises";

const [english, bengali] = await Promise.all([
  readFile(new URL("../src/locales/en.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../src/locales/bn.json", import.meta.url), "utf8").then(JSON.parse),
]);

function flattenKeys(value, prefix = "") {
  return Object.entries(value).flatMap(([key, nested]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return nested && typeof nested === "object" && !Array.isArray(nested)
      ? flattenKeys(nested, path)
      : [path];
  });
}

const englishKeys = new Set(flattenKeys(english));
const bengaliKeys = new Set(flattenKeys(bengali));
const missingInBengali = [...englishKeys].filter((key) => !bengaliKeys.has(key));
const missingInEnglish = [...bengaliKeys].filter((key) => !englishKeys.has(key));
const capitalizationErrors = [];

for (const [sectionName, section] of Object.entries({
  navigation: english.nav,
  navigationGroups: english.navGroup,
  buttons: english.actions,
})) {
  for (const [key, value] of Object.entries(section ?? {})) {
    if (typeof value === "string" && /^[a-z]/.test(value.trim())) {
      capitalizationErrors.push(`${sectionName}.${key}: "${value}"`);
    }
  }
}

if (missingInBengali.length || missingInEnglish.length || capitalizationErrors.length) {
  for (const key of missingInBengali) console.error(`Missing in bn.json: ${key}`);
  for (const key of missingInEnglish) console.error(`Missing in en.json: ${key}`);
  for (const value of capitalizationErrors) console.error(`English label must start uppercase: ${value}`);
  process.exitCode = 1;
} else {
  console.log(`Locale keys match (${englishKeys.size} keys).`);
}
