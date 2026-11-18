# Editing Doctor Whodoku data

Open [the data editor](https://walwalrus.github.io/DoctorWhodoku/data-editor.html), also linked from the game.

## Add a character and their evidence

Selecting a character in **any** character dropdown now synchronises the other sections. Beneath the character form, **Existing connections** shows every stored episode link (including passive appearances), category fact and scene explanation. **Edit link** and **Edit fact** open the relevant saved entry. Choosing a different character clears stale episode selection and evidence.

1. Choose **New character**, enter a familiar display name and any alternative names, and save. Existing stable IDs are locked to preserve references.
2. Choose **New episode**, enter its title and unique ID, and choose Series 1, 2, 3, 4 or Specials (2005–2010). Episode number and air date can be left blank when unknown.
3. Under **Episode appearances**, select the character and episode. Save an in-person, voice or broadcast appearance to make the character eligible in the game. Still images, archive clips and remains are not active appearances.
4. Under **Confirmed category facts**, select a category and an evidence episode, then describe the scene. A source URL is optional.
5. Leave unknown facts blank. There is no need to fill every category. Unrecorded facts are not counted as matches.

One supporting scene per category is enough. The editor can revise or clear a fact. An appearance does not automatically prove that characters met.

## Save and publish

### Bulk import

Use **Bulk import game data** to merge existing game-schema JSON into the current draft. Select one or more of `characters.json`, `episodes.json`, `appearances.json`, `categories.json`, or a single JSON object containing any of those arrays. Click **Preview import**, review counts and conflicts, then **Add preview to draft**. Importing never publishes to GitHub.

The importer also accepts raw TVmaze episode and show-cast JSON exports, with any filename. Choose both files together, click **Preview import**, inspect the counts and skipped-record messages, then **Add preview to draft**. Restore your saved draft first if it contains unpublished edits you want to retain.

TVmaze IDs are saved in `externalIds.tvmaze`. Matches retain the game's existing IDs, appearances and trivia facts. New records receive stable `tvmaze-episode-…` or `tvmaze-character-…` IDs. Re-importing the same data does not create duplicates. Episode names, dates, series and numbers are converted; specials use `series: "specials"`, retain their TVmaze season separately, and do not receive an invented number when the source number is null.

All episodes in the selected file are imported, including later series and specials; this does not automatically limit imports to Series 1–4. Identical character names with different TVmaze IDs and generic Doctor identities are skipped for manual review rather than combined. The preview lists these records. The show-cast export is not a complete episode cast list: it creates character records, but no episode appearances, encounter facts or other trivia links. Add those in the editor afterwards; the gaps report identifies records still needing connections. New characters only become game answers once they have qualifying appearance links.

Existing values take priority. Review any conflicting metadata reported by the preview. Download all four game JSON files after editing and upload them to GitHub to publish. Do not replace the published game files directly with raw TVmaze exports. Source: [TVmaze](https://www.tvmaze.com/).

Records match by stable ID; appearances match by character ID plus episode ID. New records and missing fields are added; aliases are combined. Existing non-empty values and complete category facts are preserved when they conflict. Conflicts appear in the preview for manual review. Re-importing the same batch does not duplicate records. A possible duplicate display name with a different ID stops the import so you can reconcile the IDs first. Invalid references stop the entire import without changing the draft.

Example game-format bundle (illustrative placeholders, not show data):

```json
{
  "characters": [{"id":"example-character","name":"Example character","aliases":[],"kind":"individual","playable":true,"storyTraits":{}}],
  "episodes": [{"id":"example-episode","title":"Example episode","series":2,"episodeNumber":1,"ukAirDate":null}],
  "appearances": [{"characterId":"example-character","episodeId":"example-episode","mode":"in-person"}]
}
```

### What still needs filling

**Check and download → Gaps to review** shows current era coverage, episodes without links, included characters without active appearances, characters without any category facts, excluded entries awaiting review, and categories with fewer than two matches. Review buttons jump to the relevant character or episode. **Download gap report** exports this list as `data-gaps.json`; this report is for review, not one of the four game files.

The report cannot know a complete cast from a partial one. Nor does it treat an unrecorded fact as false. An episode with one link is not necessarily complete; a character with one fact may still need others. Enemy encounters and TARDIS entry must be supported by scenes, not inferred from appearing in the same episode.

Series 2–4 and specials are still unpopulated in the published dataset. Episode metadata, episode-level character appearances and in-universe category facts remain outstanding for that expansion.

### Inclusion policy

Include named/speaking supporting characters, recognisable roles, and identifiable alien guests. Use **Battles in Time** as a relevance and naming reference, not proof of a character's encounters. Do not exclude a character just because their wiki article is short. Incidental background extras, image-only entries and uncertain off-screen identities still need individual judgement.

34 existing Series 1 entries have been restored, including Mr Redpath, Mrs Peace, the Platform One alien groups, Coffa, Lute, Algy, De Maggio, Cathy Salt and Davitch Pavale. Cards and other review sources are recorded on the character as `selectionSources`; card numbers, where checked, are in `battlesInTime`. The reference checklist is [The Millennium Effect](https://millenniumeffect.co.uk/index.php/battles-in-time/). Entries still excluded are explicitly marked as awaiting individual review, rather than asserted to be background characters.

The editor starts with the four published game files. Each save also stores a draft in this browser. Use **Restore saved draft** when returning on the same device.

Download **characters.json**, **episodes.json**, **appearances.json** and **categories.json**. You can test them in the game's **Load different data** section before publishing.

To publish, open the repository root in GitHub, choose **Add file → Upload files**, upload all four files under their exact original names and commit. Wait for Pages to deploy, then refresh the game. The editor never writes to GitHub by itself.

The editor preserves additional fields it does not expose, such as performer metadata and creature type IDs. Validation checks unique IDs, duplicate appearances and missing character/episode references. It cannot verify the accuracy of a scene.

## Where the fields live

- `characters.json`: `name`, `aliases`, `kind`, `playable`, and `storyTraits`.
- `episodes.json`: `id`, `title`, `series`, `episodeNumber`, `ukAirDate`, `sources`.
- `appearances.json`: `characterId`, `episodeId`, `mode`.
- Each `storyTraits` entry stores `episodeId`, `evidence`, and optional `source`.

The game and editor support further-era entries but the shipped catalogue remains the existing Series 1 dataset until entries are supplied. No missing Series 2–4 facts or appearances have been invented.

## Categories prepared for expansion

Alongside the existing categories, the forms and game recognise encounters with Cybermen, Weeping Angels, the Master, Ood, Sontarans and Judoon, plus time travel and visiting a parallel universe. A category enters the puzzle pool only when at least two playable characters have matching facts; the grid still needs valid intersections and nine distinct answers.




## Manage categories

The game and editor now share `categories.json`; no HTML edits are needed.

1. Open **Categories → Edit a category**. Its saved character connections appear below the form.
2. Change **Clue name** to rename it. Existing IDs are locked and connections stay attached.
3. Untick **Enabled in new grids**, then **Save category**, to exclude it without deleting any facts. Disabled categories remain in the character fact dropdown. Tick it again to re-enable it.
4. Use **New category** to add a clue name and definition. The editor creates an ID, which you can edit before the first save. Add matching characters and scene evidence under **Confirmed category facts**.
5. Changing a definition with existing connections pauses that category in grids. Review the listed facts, tick **I have checked the definition against the saved connections**, and save to clear the review flag. Changing only the clue name does not trigger a review.
6. To disable episode clues, select **Appears in {episode}** and untick Enabled. If renaming this template, retain `{episode}` so the game inserts each title.

Download and upload `categories.json` to publish category-only edits. If you also change character evidence or other data, download and upload all four files. Draft saves remain local until uploaded to GitHub. **Load different data** in either game page now requires all four JSON files; when running a game HTML file locally, keep `category-config.js` alongside it.

Older local drafts without categories inherit the currently loaded category definitions when restored. Legacy facts have been preserved in disabled categories marked for review, rather than silently deleted or re-enabled. Bulk imports can add categories and fill missing fields; as before, conflicts with existing values are preserved for manual editing.

Turning off too many categories can leave no valid grid. The generator will explain this; it never silently re-enables a category. Every generated square still needs at least two answers and the whole grid needs nine distinct answers.


## Delete a category or character

Select an existing entry, then use **Delete category** or **Delete character** beside its Save button. The confirmation lists the affected connections. Cancel leaves the draft untouched.

- Deleting a category removes its definition and every character fact assigned to it. It does not delete characters or episode appearance links. Disable it instead if you want to retain those facts.
- Deleting a character removes their record, episode appearances and category facts, plus references to them in other characters' `typeIds`. It retains the episodes, other characters and category definitions.
- **Undo last deletion** restores the draft immediately before the most recent deletion. It is available until another save, import, restore, reload or deletion replaces that state; it does not persist across page refreshes.

Deletion edits the local draft only. **Download and upload all four JSON files** to publish removals consistently. Do not use the additive bulk importer to publish deletions: it deliberately preserves existing records. GitHub's commit history retains previous published versions.

