import fs from "fs";
import path from "path";

export default function handler(req, res) {
    const dir = path.join(process.cwd(), "public/assets/activation_texts");

    try {
        // Get all .json files from the directory
        const files = fs.readdirSync(dir).filter(file => file.endsWith(".json"));
        res.status(200).json({ files });
    } catch (error) {
        res.status(500).json({ error: "Could not read activation text files" });
    }
}
