import "dotenv/config";
import Mux from "@mux/mux-node";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

console.log("MUX_TOKEN_ID set:", !!process.env.MUX_TOKEN_ID);
console.log("MUX_TOKEN_SECRET set:", !!process.env.MUX_TOKEN_SECRET);

(async () => {
  try {
    const upload = await mux.video.uploads.create({
      new_asset_settings: {
        passthrough: "test-user",
        playback_policy: ["public"],
        input: [
          {
            generated_subtitles: [
              { language_code: "en", name: "English" },
            ],
          },
        ],
      },
      cors_origin: "*",
    });
    console.log("SUCCESS:", JSON.stringify({ id: upload.id, url: upload.url }, null, 2));
  } catch (e: any) {
    console.log("ERROR name:", e.name);
    console.log("ERROR status:", e.status);
    console.log("ERROR message:", e.message);
    if (e.error) console.log("ERROR body:", JSON.stringify(e.error));
  }
})();
