<script lang="ts">
  import { t } from '../../lib/i18n';
  import rawContributors from '../../lib/generated/contributors.json';

  const version = chrome.runtime.getManifest().version;
  const REPO = 'ErnaneJ/tradingworks-plus';
  const AUTHOR_URL = 'https://ernane.dev/';

  const links = [
    { key: 'sourceCode', url: `https://github.com/${REPO}` },
    { key: 'privacyPolicy', url: `https://github.com/${REPO}/blob/main/docs/privacy_policy/en.md` },
    { key: 'reportIssue', url: `https://github.com/${REPO}/issues/new` },
  ] as const;

  interface Contributor {
    login: string;
    avatarUrl: string;
    htmlUrl: string;
  }

  const contributors = rawContributors as Contributor[];
  const contributorsFailed = contributors.length === 0;
</script>

<h1>{$t('options.tabAbout')}</h1>

<p class="version">{$t('about.version', { version })}</p>
<p class="disclaimer">{$t('about.disclaimer')}</p>
<p class="author">
  {$t('about.authorPrefix')} <a href={AUTHOR_URL} target="_blank" rel="noreferrer">Ernane Ferreira</a>
</p>

<ul class="links">
  {#each links as link}
    <li><a href={link.url} target="_blank" rel="noreferrer">{$t(`about.${link.key}`)}</a></li>
  {/each}
</ul>

<h2>{$t('about.contributorsHeading')}</h2>
{#if contributorsFailed}
  <p class="contributors-error">{$t('about.contributorsError')}</p>
{:else if contributors.length > 0}
  <ul class="contributors">
    {#each contributors as contributor (contributor.login)}
      <li>
        <a href={contributor.htmlUrl} target="_blank" rel="noreferrer" title={contributor.login}>
          <img src={contributor.avatarUrl} alt={contributor.login} loading="lazy" />
        </a>
      </li>
    {/each}
  </ul>
{/if}

<style>
  h1 {
    font-size: 20px;
    margin: 0 0 8px;
  }

  .version {
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--color-text-muted);
    margin: 0;
  }

  .disclaimer {
    font-size: 13px;
    color: var(--color-text-muted);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 10px 12px;
    margin: 8px 0 16px;
    line-height: 1.5;
  }

  .author {
    font-size: 14px;
    color: var(--color-ink);
    margin: 4px 0 16px;
  }

  .author a {
    color: var(--color-brand);
    text-decoration: none;
  }

  .author a:hover {
    text-decoration: underline;
  }

  .links {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .links a {
    font-size: 14px;
    color: var(--color-brand);
    text-decoration: none;
  }

  .links a:hover {
    text-decoration: underline;
  }

  h2 {
    font-size: 15px;
    margin: 24px 0 8px;
  }

  .contributors-error {
    font-size: 13px;
    color: var(--color-text-muted);
    margin: 0;
  }

  .contributors {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
    gap: 8px;
    max-width: 320px;
  }

  .contributors img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: block;
  }
</style>
