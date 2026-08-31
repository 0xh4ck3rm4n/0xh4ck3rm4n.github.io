# Music Player audio files

The desktop Music Player is fully wired up (play/pause, per-track duration,
progress bar, auto-advance to the next track) — it just needs actual audio
files here, since I can't source or embed copyrighted commercial tracks for
you.

Drop your own **legally-owned** mp3 files in this folder using these exact
filenames (the player references them by path):

| # | Title                        | Artist            | Expected filename                       |
|---|-------------------------------|-------------------|------------------------------------------|
| 1 | All I Want is You             | Miguel            | `01-all-i-want-is-you.mp3`               |
| 2 | Weird Fishes / Arpeggi        | Radiohead         | `02-weird-fishes-arpeggi.mp3`            |
| 3 | The Less I Know The Better    | Tame Impala       | `03-the-less-i-know-the-better.mp3`      |
| 4 | Softcore                      | The Neighbourhood | `04-softcore.mp3`                        |
| 5 | Sex, Drugs, Etc.               | Beach Weather     | `05-sex-drugs-etc.mp3`                   |

Once a file is present, its row will show the real duration (read from the
file's metadata) and play correctly. Until then, clicking a row will just
show "Audio file not found" in the player status line — nothing breaks.

To use different tracks, edit the `MUSIC_TRACKS` array in
`quartz/components/frames/DefaultFrame.tsx` (title, artist, and `src` path).
