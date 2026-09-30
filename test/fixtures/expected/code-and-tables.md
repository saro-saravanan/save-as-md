---
title: "Install the CLI · Example Docs"
source: "https://docs.example.com/cli/install"
site: "docs.example.com"
saved: "2026-01-01T00:00:00.000Z"
---

# Install the CLI · Example Docs

The command-line tool runs on Windows, macOS and Linux. Install it with your usual package manager, then check that it is on your path before continuing with the rest of this guide.

```shell
# install
npm install -g example-cli
```

Each platform keeps its configuration in a different place. The table below lists where to look if you need to edit settings by hand or reset the tool to its defaults.

<table><tbody><tr><td>Windows</td><td>%APPDATA%\example</td></tr><tr><td>macOS</td><td>~/Library/Application Support/example</td></tr><tr><td>Linux</td><td>~/.config/example</td></tr></tbody></table>



After installing, run `example --version` to confirm everything worked. If the command is not found, restart your terminal so it picks up the updated path.
