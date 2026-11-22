# Publish from the editor

The editor now caches saved edits locally and can publish all four JSON data files in one GitHub commit. The live game remains on GitHub Pages. No backend or hosting changes are required.

## One-time credential setup

1. Open https://github.com/settings/personal-access-tokens/new while signed in as WalWalrus.
2. Name it **DoctorWhodoku editor**. Choose an expiry (for example 30 days).
3. Resource owner: **WalWalrus**.
4. Repository access: **Only select repositories → DoctorWhodoku**.
5. Repository permissions: **Contents → Read and write**. Metadata read access is automatic. No account, administration, workflows or other permissions are needed.
6. Generate the token and keep it in your password manager. Do not upload it, put it in a JSON file or send it in chat.

## Each editing session

1. Open https://walwalrus.github.io/DoctorWhodoku/data-editor.html.
2. Paste the token into the GitHub token field and click **Connect to GitHub**. The field is cleared immediately. The credential stays only in this tab's JavaScript memory and is sent only to api.github.com; it is not saved to localStorage, sessionStorage, the draft, a URL or the repository.
3. Edit and use the relevant Save buttons. Those edits are cached automatically on this browser/device and survive refresh. Unsaved form inputs are not published.
4. Click **Publish all changes**, review the added/changed/removed counts, and confirm. All four files are committed together. There is no download/upload step.
5. Wait for GitHub Pages to finish deploying. Use **Check live deployment** if needed, then refresh the game.

Refreshing requires reconnecting with the token, but preserves your draft. Disconnect clears the in-memory credential. Publishing failures preserve the draft. This is personal-token authentication, not OAuth or persistent sign-in.

## Conflicts and recovery

Publishing stops if any of the four remote data files changed since connection. Disconnect/reconnect to compare the latest remote version against your draft; review removals carefully, especially with old local drafts. No automatic merging of competing edits is performed. An unrelated code commit does not by itself block publishing. Branch updates never use force.

If the connection fails during the final request, the commit may already have succeeded: reconnect and compare before retrying. Re-publishing identical files does not create another commit. Edits saved while publishing stay local for the next publish.

401: expired/invalid token; create or replace it. 403: check repository selection, Contents write permission, account access or rate limits. Branch rules can also prevent direct updates; the editor does not bypass them. Revoke the token in GitHub settings when no longer needed. Backup downloads remain available.

Documentation: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens
