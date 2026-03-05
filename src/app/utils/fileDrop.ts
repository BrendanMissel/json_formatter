const ALLOWED_EXTENSIONS = ['.json', '.txt'];

function hasAllowedExtension(file: File): boolean {
  const name = file.name.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

/**
 * Read a dropped file and validate it as JSON.
 * Only .json and .txt files are accepted.
 * Returns content on success, or an error message when file type is unsupported or JSON is invalid.
 */
export async function readJsonFile(
  file: File
): Promise<{ content: string } | { error: string }> {
  if (!hasAllowedExtension(file)) {
    return { error: 'Unsupported file type. Use .json or .txt.' };
  }

  let text: string;
  try {
    text = await file.text();
  } catch {
    return { error: 'Could not read file.' };
  }

  const trimmed = text.trim();
  if (trimmed === '') {
    return { error: 'File is empty or contains only whitespace.' };
  }

  try {
    JSON.parse(trimmed);
    return { content: trimmed };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Invalid JSON';
    return { error: `Invalid JSON: ${message}` };
  }
}
