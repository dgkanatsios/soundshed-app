# Soundshed Control

This is an independently maintained fork of [Soundshed Control](https://github.com/soundshed/soundshed-app) by Webprofusion / Christopher Cook. It is not the official soundshed.com site. The original MIT copyright and license notice are preserved in [LICENSE](LICENSE), including in the web build.

Desktop and Web UI which can be used to:
- manage tone library and browse tone communities
- connect to supported amp via bluetooth, manage basic settings and set presets.
- browse and favourite video backing tracks

See https://soundshed.com for info.

Windows, macOS and Linux. 64-bit OS and Bluetooth (BLE) connectivity required.

*Supported amps:*
- Positive Grid Spark 40, Spark Mini (Spark 2, Spark GO are experimentally supported): https://www.positivegrid.com/spark/

![](https://github.com/soundshed/soundshed-app/raw/main/docs/screens/ui.png)


### Known Issues
- Invalid settings may crash amp, requiring amp to be switched off and on again.

## Roadmap

Possible future features include:

- More reliable amp communication
- UI refinements
- More tone community features
- Lessons (community supplied links to video lessons etc)
- artist and song metadata for correct cross reference of tones, backing tracks and lessons.
- Support for an extensible range of amp and FX units
    - Abstraction to map device fx settings to a "soundshed" generic list of common FX.
    - For new devices implement read/write of presets/fx settings from the device and mappings to generic fx
    - Allow presets made for any device to be approximately mapped to any other support device.
    - Provide preset cloud for devices which don't natively have one.
    - Possibly extend presets to include impulse response (IR) waveforms for devices that support them.
    - Example Target devices: Line 6 Pod Go, Boss Katana MK II

#### Event Mapping
Input event from keyboard or midi can be mapped to a preset slot (e.g. channels 1-4). The app can currently learn some midi control inputs (note-on and program-change) and assign them to amp channel selections.

#### Default FX
- default slot settings (fx type, parameter settings) can be applied, e.g a default Noise Gate configuration which can either be applied all the time or on demand.

----------------------------------------

## Developer Build Info
![app build](https://github.com/dgkanatsios/soundshed-app/actions/workflows/build.yml/badge.svg)
- Prerequisites: Node 20.x or higher, npm 6.14 or higher. Windows, macOS or Linux

- VS Code is the recommended editor

- If working on the Lessons portion, you will need to add your youtube-data-api key to the `/src/env.ts` file. More information available [here](https://developers.google.com/youtube/v3/getting-started). Please do not submit this file in pull requests.

- Clone this repository
- run `npm install` on the repo path

## Run Web Version
- Web mode is selected by default in `src/core/platformUtils.ts` and `src/env.ts`. To enable backing-track search locally, set `YOUTUBE_API_KEY` in your environment before building (see Netlify instructions below).
- Run `npm run watch-web` in one terminal to continuously rebuild the UI code or `npm run build-web` to just build once. Note that there is a build for the app UI and a build for the electron main process, some of which use the same files (types etc).
- Run `npx http-server build` to start local web server on http://localhost:8080/
- Example with SSL enabled: `npx http-server build --ssl -K C:/Work/Misc/ssl/localhost-key.pem -C C:/Work/Misc/ssl/localhost.pem`

## Deploy this fork to Netlify

- Import `dgkanatsios/soundshed-app` as a Netlify site, with `main` as the production branch. The committed `netlify.toml` runs `npm run build-web` on Node 22 and publishes `build/`. Netlify installs the npm dependencies automatically.
- Configure `YOUTUBE_API_KEY` in Netlify's build environment with a **key you control** if you want Jam backing-track search. Restrict it in Google Cloud to the YouTube Data API and your Netlify site's HTTPS referrer(s), then redeploy. This is a **public browser key**, not a secret: it is included in the generated JavaScript. Without a key, search is explicitly unavailable, but saved favourites and other app features remain usable.
- This fork no longer loads the original site's Google Analytics property. If you add your own analytics, configure consent and privacy notices appropriate to your deployment.
- Amp connection needs HTTPS and a browser/OS combination with Web Bluetooth support. This fork still uses the upstream `api-proxy.soundshed.com` service for tone/community features, which you do not control; check its availability and usage terms before relying on it.
- The existing GitHub desktop release workflow depends on the original project's private signing repository and is **not** a way to publish this fork's web app. Netlify builds directly from this repository.

## Run Electron Version
- edit platformUtils.ts to include platformUtils.electron.ts, edit env.ts not to be web mode
- Run `npm run watch-electron` in one terminal to continuously rebuild the UI code or `npm run build-electron` to just build once. Note that there is a build for the app UI and a build for the electron main process, some of which use the same files (types etc).
- Run `npm run start-electron` to launch the UI

The final installable app is packaged using electron-forge:
`npm run make`

## Toggle between web and electron mode
- edit env.ts, set IsWebMode true/false
- edit platformUtils.ts, import required platform

## Use TCP Spark Simulator In App
1. Ensure Electron mode is selected:
    - set `IsWebMode` to `false` in `src/env.ts`
    - select the Electron import in `src/core/platformUtils.ts`
2. Build simulator tools once: `npm run build-tools`
3. Start simulator TCP mode from repo root:
    `npm run sim:spark -- --model spark-2 --transport tcp --host 127.0.0.1 --port 9124 --verbose`
4. In [src/env.ts](src/env.ts), set:
    - `SparkTransport: "tcp-sim"`
    - `SparkSimulatorHost: "127.0.0.1"`
    - `SparkSimulatorPort: 9124`
    - `SparkSimulatorModel: "spark-2"`
5. Start the app and run device scan/connect as normal. The app will show a virtual TCP simulator device instead of opening the BLE chooser.
6. To switch back to real hardware BLE, set `SparkTransport: "ble"`.

### Headless TCP Comms Test
- Run `npm run sim:spark:test` to start a temporary TCP simulator and exercise spork comms encode/decode flows without launching the app UI.
- Use `npm run sim:spark:test:quick -- --port 9124` for faster reruns after app TS is already built.

## Unit Tests

Unit tests run on [Vitest](https://vitest.dev/) and need no hardware, simulator or network access.

```bash
npm test             # run once
npm run test:watch   # re-run on change
npm run test:coverage
```

Tests live in `src/spork/src/devices/spark/__tests__/` and cover the Spark
protocol layer, which is the code most likely to break silently:

| File | Covers |
| --- | --- |
| `sparkMessageReader.test.ts` | msgpack primitives: float, string, on/off, cursor handling |
| `sparkCommandMessage.test.ts` | Block framing, 7-bit payload packing, command ids, multi-chunk splitting |
| `protocolRoundtrip.test.ts` | Encode → transport-normalise → decode for every command the app sends |
| `sparkDeviceManager.test.ts` | Device orchestration against a fake transport: Spark 2 detection, chunked upload acks, reconnect |

The round-trip tests are the important ones. They encode a command with
`SparkCommandMessage`, strip the transport header exactly as `TcpProvider`/
`BleProvider` do, then decode it with `SparkMessageReader` and assert the
values survive. A regression in either the bit packing or the chunk reassembly
fails the round trip rather than silently corrupting amp state.

`npm test` runs in CI on every push and pull request, and the web build depends
on it passing.

## Release Process 
- Electron
    - ensure electron config selected
    - ensure webpack.electron.config is set to production
    - Increment version in package.json, run installer Github Action, run Release Github Action, Edit release notes.
- Web
    - ensure web config selected
    - ensure webpack.web.config is set to production
    - Run build and deploy files
    
### Architecture
The app is built using TypeScript. For the electron version, electron/node is the host process, talking to the electron renderer and back again (the standard electron way of working). Both web and electron versions now use Web Bluetooth (BLE).

The UI is React (TypeScript variant) with bootstrap for UI css. The Pullstate library is use for app state management and a couple of view model classes exist to centralise common points of interaction with APIs, the devices and state.

Original template is loosely based on https://www.sitepen.com/blog/getting-started-with-electron-typescript-react-and-webpack

#### Hardware communication

See our [Spark Amp Protocol document](docs/spark-amp-protocol.md) for current understanding of the spark amp communication.

[BLE Reader Data Received Queue]

[Spark Reader Message Queue]

[App Message Reader Loop]

At the bluetooth level the app registers a listener to consume data changes for a hardware characteristic, this delivers a stream of bytes in chunks. The app continuously queues the data recieved and looks for message terminator bytes (F7). When encountered it queues the current data for message processing higher up the chain.

The app then continuously runs a message processing loop to peek for terminated data chunks from the bluetooth reader, these are picked up from the bluetooth reader queue and parsed/interpreted into messages for our app, then added to our app message queue for later processing.
