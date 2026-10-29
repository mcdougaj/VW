import { Config } from "@remotion/cli/config";
import fs from "node:fs";
import os from "node:os";
// The cloud container has a preinstalled headless shell; on your PC Remotion downloads its own.
const cloudShell = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
if (fs.existsSync(cloudShell)) Config.setBrowserExecutable(cloudShell);
Config.setVideoImageFormat("jpeg");
Config.setConcurrency(Math.max(1, Math.min(8, os.cpus().length)));
