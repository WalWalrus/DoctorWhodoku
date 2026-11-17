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

Use **Bulk import game data** to merge existing game-schema JSON into the current draft. Select one or more of `characters.json`, `episodes.json`, `appearances.json`, or a single JSON object containing any of those arrays. Click **Preview import**, review counts and conflicts, then **Add preview to draft**. Importing never publishes to GitHub.

This is a game-format importer, not a TVmaze converter. Raw TVmaze episode/cast exports are not accepted and have not been loaded into the published catalogue.

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

**Check and download → Gaps to review** shows current era coverage, episodes without links, included characters without active appearances, characters without any category facts, excluded entries awaiting review, and categories with fewer than two matches. Review buttons jump to the relevant character or episode. **Download gap report** exports this list as `data-gaps.json`; this report is for review, not one of the three game files.

The report cannot know a complete cast from a partial one. Nor does it treat an unrecorded fact as false. An episode with one link is not necessarily complete; a character with one fact may still need others. Enemy encounters and TARDIS entry must be supported by scenes, not inferred from appearing in the same episode.

Series 2–4 and specials are still unpopulated in the published dataset. Episode metadata, episode-level character appearances and in-universe category facts remain outstanding for that expansion.

### Inclusion policy

Include named/speaking supporting characters, recognisable roles, and identifiable alien guests. Use **Battles in Time** as a relevance and naming reference, not proof of a character's encounters. Do not exclude a character just because their wiki article is short. Incidental background extras, image-only entries and uncertain off-screen identities still need individual judgement.

34 existing Series 1 entries have been restored, including Mr Redpath, Mrs Peace, the Platform One alien groups, Coffa, Lute, Algy, De Maggio, Cathy Salt and Davitch Pavale. Cards and other review sources are recorded on the character as `selectionSources`; card numbers, where checked, are in `battlesInTime`. The reference checklist is [The Millennium Effect](https://millenniumeffect.co.uk/index.php/battles-in-time/). Entries still excluded are explicitly marked as awaiting individual review, rather than asserted to be background characters.

The editor starts with the three published game files. Each save also stores a draft in this browser. Use **Restore saved draft** when returning on the same device.

Download **characters.json**, **episodes.json** and **appearances.json**. You can test them in the game's **Load different data** section before publishing.

To publish, open the repository root in GitHub, choose **Add file → Upload files**, upload all three files under their exact original names and commit. Wait for Pages to deploy, then refresh the game. The editor never writes to GitHub by itself.

The editor preserves additional fields it does not expose, such as performer metadata and creature type IDs. Validation checks unique IDs, duplicate appearances and missing character/episode references. It cannot verify the accuracy of a scene.

## Where the fields live

- `characters.json`: `name`, `aliases`, `kind`, `playable`, and `storyTraits`.
- `episodes.json`: `id`, `title`, `series`, `episodeNumber`, `ukAirDate`, `sources`.
- `appearances.json`: `characterId`, `episodeId`, `mode`.
- Each `storyTraits` entry stores `episodeId`, `evidence`, and optional `source`.

The game and editor support further-era entries but the shipped catalogue remains the existing Series 1 dataset until entries are supplied. No missing Series 2–4 facts or appearances have been invented.

## Categories prepared for expansion

Alongside the existing categories, the forms and game recognise encounters with Cybermen, Weeping Angels, the Master, Ood, Sontarans and Judoon, plus time travel and visiting a parallel universe. A category enters the puzzle pool only when at least two playable characters have matching facts; the grid still needs valid intersections and nine distinct answers.

