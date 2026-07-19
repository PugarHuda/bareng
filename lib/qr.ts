// QR codes for the two things worth scanning with a phone: a pot invite link ("scan to join the
// patungan") and a one-time receive address ("scan to pay me privately"). Self-contained — the
// data URL renders inline with no network, so it works on the static/offline demo too.

import qrcode from "qrcode-generator";

/** A GIF data URL for `data`, drop straight into <img src>. Error-correction M survives a phone
 *  camera at an angle. cellSize/margin are in pixels of the source bitmap (upscale with CSS). */
export function qrDataUrl(data: string, cellSize = 4, margin = 4): string {
  const qr = qrcode(0, "M"); // type 0 = auto-fit the smallest version for the data
  qr.addData(data);
  qr.make();
  return qr.createDataURL(cellSize, margin);
}
