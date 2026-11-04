# Knowclip
![GitHub](https://img.shields.io/github/license/knowclip/knowclip) [![Linux Node CI](https://github.com/Kechicode/knowclip/actions/workflows/linux.yml/badge.svg)](https://github.com/Kechicode/knowclip/actions/workflows/linux.yml) [![MacOS Node CI](https://github.com/Kechicode/knowclip/actions/workflows/macos.yml/badge.svg)](https://github.com/Kechicode/knowclip/actions/workflows/macos.yml) [![Windows Node CI](https://github.com/Kechicode/knowclip/actions/workflows/windows.yml/badge.svg)](https://github.com/Kechicode/knowclip/actions/workflows/windows.yml) 

A cross-platform desktop application for turning audio and video files into flashcards.

It works like this:

1. Choose a media file.
2. Make your clips (manually or automatically).
3. Export your audio flashcards for use in [Anki](https://apps.ankiweb.net/).

Currently being built with [Electron](https://electronjs.org), [Vite](https://vitejs.dev/), [Redux](https://redux.js.org/) and [RxJS](https://rxjs-dev.firebaseapp.com/). Audio processing is done with [ffmpeg](https://ffmpeg.org/).

### Demo: [Making cards automatically with subtitled video](https://www.youtube.com/watch?v=mq_w2Qgikt8)
[![Knowclip](img/screenshot_200324.png)](https://www.youtube.com/watch?v=mq_w2Qgikt8)

### Features

- Make clips manually or automatically, with silence detection and subtitles
  integration.
- Export your cards as an Anki deck (`.apkg`), or export a single card's audio
  as an mp3 file.
- Preview a single card before exporting it, to see exactly how it will look in
  Anki: front and back, fields, image, cloze deletions and audio.
- Resize cards with the keyboard, and merge overlapping cards when you want to.
- Configure how much extra time is appended to the end of each exported clip,
  so that sounds don't get cut off mid-decay.

See the [changelog](./CHANGELOG.md) for the full list of changes.

### Downloads

Releases are published at [github.com/Kechicode/knowclip/releases](https://github.com/Kechicode/knowclip/releases).

Currently only a **macOS** build is published. The app is not code-signed, so
the first time you open it you need to hold `Ctrl` and click it, then choose
"Open". If macOS still refuses to open it, run this in your terminal:

```bash
xattr -d com.apple.quarantine /Applications/Knowclip.app
```

Knowclip bundles its own copy of ffmpeg, so no additional software is needed
to use it.

### Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Shift` + `Space` (`Ctrl` + `Space` on Windows) | Play / pause |
| `Ctrl` + `L` | Toggle looping of the selected card |
| `←` / `→` | Select the previous / next card |
| `Alt` + `←` / `→` | Select the previous / next card while editing |
| `Shift` + `←` / `→` | Move the end of the selected card earlier / later |
| `Shift` + `Alt` + `←` / `→` | Move the start of the selected card earlier / later |
| `D` | Look up the word at the mouse cursor |
| `Esc` | Stop editing / close dialogs |
| `E` | Start editing the selected card's fields |
| `P` | Preview the selected card |
| `C` | Start making a cloze deletion |
| `Ctrl` + `Shift` + `D` | Delete the selected card |
| `Ctrl` + `M` | Merge the selected card with overlapping cards |
| `Ctrl` / `Cmd` + `S` | Save the project |
| `Ctrl` / `Cmd` + `Shift` + `S` | Save the project as a new file |

See the "Keyboard shortcuts" panel in the app for the same list, with the
correct modifiers for your platform.

### Development

To install NPM packages:

```bash
npm install
```

Once packages are installed, you may run the dev build:

```bash
npm start
```

A dev build of the Electron app will open automatically. The server will be running in the background, with Hot Module Reloading available by default, thanks to [electron-vite](https://evite.netlify.app/).

### Tests

Tests are run with [Vitest](https://vitest.dev/).

#### Unit tests

```bash
npm test
```

#### Integration tests

Integration tests use [Webdriverio](https://webdriver.io/) to make sure all the parts of the app are working together.

```bash
npm run integration
```


The disadvantage of integration tests is that they are slow to run. To speed things up while writing tests, you can run these scripts instead:

```bash
# Run integration tests
# without rebuilding the app.
# Useful if you only changed test code
npm run integration:skip-build

# Run integration tests
# without closing the app at the end.
# Lets you inspect things (e.g. with dev tools)
# in the event of a test failure.
npm run integration:debug


# run the test without building the app
# and without closing the app on completion.
# (combines debug "d" and skip-build "s")
npm run integration:ds
```

#### Test CLI options

Any arguments you pass to the test scripts will be [forwarded to Vitest](https://vitest.dev/guide/cli.html#commands).

So if you wanted to say, run just one specific test, you can do something like this:

```bash
npm test -- "reducers/clips" # target tests with "reducers/clips" in the filepath
```

#### Electron upgrade config checklist

Upgrading Electron version requires a few config files to be touched.

* Node version must be updated in:
  * [.nvmrc](./.nvmrc),
  * [.tool-versions](./.tool-versions)
  * `"engines"` in [package.json](./package.json)
  * Github workflows (Mac, Linux, and Windows)
* Electron version must be updated in:
  * [.npmrc](./.npmrc) `"browserslist"`
  * `"dependencies"` in [package.json](./package.json)
* Chromedriver version must be updated:
  * update `electron-chromedriver` in `"dependencies"` [package.json](./package.json) to match Electron version