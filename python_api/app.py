from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv
import os
import re

load_dotenv()

client = OpenAI(
    api_key=os.getenv("apikey")
)

app = Flask(__name__)
CORS(app)

def generate_topics(prompt, level):

    if level == "basic":
        min_t = 5
        max_t = 10

    elif level == "intermediate":
        min_t = 10
        max_t = 15

    else:
        min_t = 25
        max_t = 30

    topic_count = max_t

    full_prompt = (
        f"Generate a learning roadmap for '{prompt}' at {level} level. "
        f"List exactly {topic_count} concise topics in order. "
        f"Each topic must be on a new line like:\n"
        "1. Topic Name\n"
        "2. Topic Name\n"
        "Do not include descriptions."
    )

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": "You generate concise learning roadmaps."
            },
            {
                "role": "user",
                "content": full_prompt
            }
        ],
        temperature=0.2,
        max_tokens=700
    )

    output = response.choices[0].message.content

    topics = re.findall(r"\d+\.\s*(.+)", output)
    topics = [t.strip() for t in topics if t.strip()]

    if len(topics) < min_t:
        topics += ["Extra Topic"] * (min_t - len(topics))

    return topics[:max_t]

@app.route("/generate", methods=["POST"])
def generate():

    data = request.get_json()

    user_prompt = data.get("prompt", "").strip()
    level = data.get("level", "advanced")

    if not user_prompt:
        return jsonify({"error": "Prompt is required"}), 400

    print(f"🧠 Generating roadmap for: {user_prompt} | Level: {level}")

    try:
        topics = generate_topics(user_prompt, level)

        return jsonify({
            "topics": topics
        })

    except Exception as e:

        print("❌ Error:", e)

        return jsonify({
            "error": "Failed to generate topics",
            "details": str(e)
        }), 500

if __name__ == "__main__":
    app.run(
        port=7000,
        debug=True,
        use_reloader=False,
        threaded=True
    )