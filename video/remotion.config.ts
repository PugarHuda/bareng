import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// CRF 16: YouTube re-encodes whatever it is given, so the compression compounds. The small UI text
// in the recorded app footage is the part that suffers first, and megabytes are free here.
Config.setCrf(16);
