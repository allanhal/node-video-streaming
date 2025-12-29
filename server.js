const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Serve static files (HTML page for testing)
app.use(express.static("public"));

// Video streaming endpoint
app.get("/video/:filename", (req, res) => {
  const filename = req.params.filename;
  const videoPath = path.join(__dirname, "videos", filename);

  // Check if file exists
  if (!fs.existsSync(videoPath)) {
    return res.status(404).json({ error: "Video not found" });
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    // Handle range requests for seeking
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const file = fs.createReadStream(videoPath, { start, end });
    const headers = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": "video/mp4",
    };

    res.writeHead(206, headers);
    file.pipe(res);
  } else {
    // No range header - send entire file
    const headers = {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
    };

    res.writeHead(200, headers);
    fs.createReadStream(videoPath).pipe(res);
  }
});

// List available videos
app.get("/api/videos", (req, res) => {
  const videosDir = path.join(__dirname, "videos");

  if (!fs.existsSync(videosDir)) {
    return res.json({ videos: [] });
  }

  const files = fs
    .readdirSync(videosDir)
    .filter((file) =>
      [".mp4", ".webm"].includes(path.extname(file).toLowerCase())
    );

  res.json({ videos: files });
});

app.listen(PORT, () => {
  console.log(`🎬 Video streaming server running at http://localhost:${PORT}`);
  console.log(`📁 Place your videos in the 'videos' folder`);
  console.log(
    `🔗 Stream a video: http://localhost:${PORT}/video/your-video.mp4`
  );
});
