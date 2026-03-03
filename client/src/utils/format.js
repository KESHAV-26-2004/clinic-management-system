// utils/format.js
export function formatName(name) {
  return name
    .trim()
    .split(/\s+/)
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase()
    )
    .join(" ");
}
