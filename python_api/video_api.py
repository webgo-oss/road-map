from flask import Flask, request, jsonify
from flask_cors import CORS
from manim import *
from gtts import gTTS
from pydub import AudioSegment
import os
import time
import shutil

app = Flask(__name__)
CORS(app)

FINAL_VIDEO_DIR = os.path.join(
    os.path.dirname(__file__),
    "../node_frontend/public/video_api"
)
os.makedirs(FINAL_VIDEO_DIR, exist_ok=True)

WORDS_PER_LINE = 6
FONT_SIZE = 36

def split_lines(text, words_per_line):
    words = text.split()
    return [" ".join(words[i:i + words_per_line]) for i in range(0, len(words), words_per_line)]

class TopicScene(Scene):
    def __init__(self, script, **kwargs):
        super().__init__(**kwargs)
        self.script = script
        self.lines = split_lines(script, WORDS_PER_LINE)

    def construct(self):
        title = Text("Learning Topic", font_size=48)
        self.play(Write(title))
        self.wait(1)
        self.play(FadeOut(title))

        for i, line in enumerate(self.lines):
            audio_file = f"temp_line_{i}.mp3"
            tts = gTTS(line)
            tts.save(audio_file)

            audio = AudioSegment.from_file(audio_file)
            duration = audio.duration_seconds

            text = Text(line, font_size=FONT_SIZE)
            self.add(text)

            if i == 0:
                self.wait(0.01) 
            self.add_sound(audio_file)

            self.wait(duration)
            self.remove(text)

            if os.path.exists(audio_file):
                os.remove(audio_file)

        self.wait(0.5)

@app.route("/generate-video", methods=["POST"])
def generate_video():
    data = request.json
    topic = data.get("topic", f"topic_{int(time.time())}").replace(" ", "_")
    script = data.get("script", "No script provided")
    timestamp = int(time.time())

    try:
        output_name = f"{topic}_{timestamp}"

        config.pixel_height = 720
        config.pixel_width = 1280
        config.frame_rate = 30
        config.output_file = output_name
        config.verbosity = "ERROR"

        scene = TopicScene(script)
        scene.render()

        generated_video = None
        for root, _, files in os.walk(config.media_dir):
            for file in files:
                if file == f"{output_name}.mp4":
                    generated_video = os.path.join(root, file)
                    break

        if not generated_video:
            raise Exception("Rendered video not found")

        final_path = os.path.join(FINAL_VIDEO_DIR, f"{output_name}.mp4")
        shutil.copy2(generated_video, final_path)

        return jsonify({
            "success": True,
            "video_url": f"/video_api/{output_name}.mp4"
        })

    except Exception as e:
        print("❌ Video generation error:", e)
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=7001, debug=False)
