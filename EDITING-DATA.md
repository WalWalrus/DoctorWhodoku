# Editing Doctor Whodoku data

Open [the data editor](https://walwalrus.github.io/DoctorWhodoku/data-editor.html), also linked from the game.

## Add a character and their evidence

1. Choose **New character**, enter a familiar display name and any alternative names, and save. Existing stable IDs are locked to preserve references.
2. Choose **New episode**, enter its title and unique ID, and choose Series 1, 2, 3, 4 or Specials (2005–2010). Episode number and air date can be left blank when unknown.
3. Under **Episode appearances**, select the character and episode. Save an in-person, voice or broadcast appearance to make the character eligible in the game. Still images, archive clips and remains are not active appearances.
4. Under **Confirmed category facts**, select a category and an evidence episode, then describe the scene. A source URL is optional.
5. Leave unknown facts blank. There is no need to fill every category. Unrecorded facts are not counted as matches.

One supporting scene per category is enough. The editor can revise or clear a fact. An appearance does not automatically prove that characters met.

## Save and publish

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
