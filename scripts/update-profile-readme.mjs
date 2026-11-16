/** Refresh the bounded activity section of the GitHub profile README.
 * No secrets are written to the README; only public repository metadata is used.
 */
import { readFile, writeFile } from 'node:fs/promises';

const start = '<!-- PROFILE_ACTIVITY_START -->';
const end = '<!-- PROFILE_ACTIVITY_END -->';
const username = 'bchbenjamin';
const token = process.env.GITHUB_TOKEN;
const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'bchbenjamin-profile-readme-updater' };
if (token) headers.Authorization = `Bearer ${token}`;
const escapeMd = (value) => String(value).replace(/[\\`*_[\]<>|\r\n]/g, ' ').replace(/\s+/g, ' ').trim();

async function main() {
  const readme = await readFile('README.md', 'utf8');
  const startIndex = readme.indexOf(start);
  const endIndex = readme.indexOf(end);
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) throw new Error('README activity markers are missing or out of order');
  const response = await fetch(`https://api.github.com/users/${username}/repos?type=owner&sort=pushed&per_page=100`, { headers });
  if (!response.ok) throw new Error(`GitHub API failed: HTTP ${response.status}`);
  const repos = await response.json();
  if (!Array.isArray(repos)) throw new Error('Unexpected GitHub API response');
  const recent = repos.filter((repo) => !repo.private && !repo.fork && !repo.archived && repo.name !== username && /^https:\/\/github\.com\//.test(repo.html_url)).slice(0, 5);
  const lines = recent.length
    ? recent.map((repo) => `- [${escapeMd(repo.name)}](${repo.html_url})${repo.description ? ` — ${escapeMd(repo.description).slice(0, 140)}` : ''}`)
    : ['Recent public repositories will appear here.'];
  const replacement = `${start}\n${lines.join('\n')}\n${end}`;
  const updated = readme.slice(0, startIndex) + replacement + readme.slice(endIndex + end.length);
  if (updated !== readme) await writeFile('README.md', updated);
  if (updated !== readme) process.stdout.write('Profile activity updated\n');
}

await main();
