/**
 * ffmpeg-static installs only the binary for the machine running npm.
 * A universal Mac app needs both slices in that one file. Download the
 * x64 and arm64 builds from the same release and combine them with lipo.
 */
const fs = require('fs')
const os = require('os')
const path = require('path')
const zlib = require('zlib')
const { execFileSync } = require('child_process')

if (os.platform() !== 'darwin') {
  process.exit(0)
}

const ffmpegDir = path.dirname(require.resolve('ffmpeg-static/package.json'))
const pkg = require(path.join(ffmpegDir, 'package.json'))
const ffmpegPath = path.join(ffmpegDir, 'ffmpeg')
const release = pkg['ffmpeg-static']['binary-release-tag']
const baseUrl =
  'https://github.com/eugeneware/ffmpeg-static/releases/download'

function downloadGz(url, dest) {
  const gzPath = `${dest}.gz`
  execFileSync(
    'curl',
    ['-L', '--retry', '3', '--retry-delay', '2', '-f', '-o', gzPath, url],
    { stdio: 'inherit' }
  )
  fs.writeFileSync(dest, zlib.gunzipSync(fs.readFileSync(gzPath)))
  fs.chmodSync(dest, 0o755)
}

function main() {
  if (fs.existsSync(ffmpegPath)) {
    const info = execFileSync('lipo', ['-info', ffmpegPath], {
      encoding: 'utf8',
    })
    if (/x86_64/.test(info) && /arm64/.test(info)) {
      console.log(info.trim())
      return
    }
  }

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'knowclip-ffmpeg-'))
  const slices = []
  for (const arch of ['x64', 'arm64']) {
    const dest = path.join(tmp, `ffmpeg-${arch}`)
    const url = `${baseUrl}/${release}/ffmpeg-darwin-${arch}.gz`
    console.log(`Downloading ${url}`)
    downloadGz(url, dest)
    fs.chmodSync(dest, 0o755)
    slices.push(dest)
  }

  execFileSync('lipo', ['-create', ...slices, '-output', ffmpegPath])
  fs.chmodSync(ffmpegPath, 0o755)
  console.log(
    execFileSync('lipo', ['-info', ffmpegPath], { encoding: 'utf8' }).trim()
  )
}

try {
  main()
} catch (error) {
  console.error(error)
  process.exit(1)
}
