export const changelogUrl = 'https://github.com/MTsNurulFalahTrs/GenerateKartu/blob/main/CHANGELOG.md';

export function parseChangelog(markdown: string) {
  const sections: { title: string; entries: string[] }[] = [];
  for (const line of markdown.split(/\r?\n/)) {
    if (line.startsWith('## ')) sections.push({ title: line.slice(3).trim(), entries: [] });
    else if (/^[-*] /.test(line)) sections.at(-1)?.entries.push(line.slice(2).trim());
  }
  return sections.filter(({ entries }) => entries.length > 0);
}

export type Changelog = ReturnType<typeof parseChangelog>;
