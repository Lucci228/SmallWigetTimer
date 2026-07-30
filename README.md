# Small Widget

A lightweight desktop widget built with Tauri.

## Prerequisites

Make sure you have the following installed before getting started:

- [Node.js](https://nodejs.org/) (v18 or later)
- [Rust](https://www.rust-lang.org/tools/install)
- [pnpm](https://pnpm.io/installation)
- Platform-specific [Tauri prerequisites](https://tauri.app/start/prerequisites/) (e.g. WebView2 on Windows, build tools on macOS/Linux)

## Getting Started

Install dependencies:

```bash
pnpm install
```

Run the app in development mode:

```bash
pnpm tauri dev
```

## Building

To create a production build:

```bash
pnpm tauri build
```

The compiled binary will be output to `src-tauri/target/release/`.

## Tech Stack

- [Tauri](https://tauri.app/) — desktop app framework
- [Node.js](https://nodejs.org/) — frontend tooling
- [Rust](https://www.rust-lang.org/) — backend/native layer
