import tkinter as tk
from tkinter import filedialog, messagebox, ttk
from bs4 import BeautifulSoup
import json
import os

def extract_data_from_html(html):
    soup = BeautifulSoup(html, 'html.parser')
    blocks = soup.find_all("div", class_="civnsfw model-block")
    data = []

    for block in blocks:
        try:
            img_url = block.find("img", {"data-sampleimg": "true"})["src"]
        except:
            img_url = ""
        meta_data = {
            dt.get_text(strip=True): dd.get_text(strip=True)
            for dt, dd in zip(block.find_all("dt"), block.find_all("dd"))
        }

        data.append({
            "image_url": img_url,
            "prompt": meta_data.get("Prompt", ""),
            "negative_prompt": meta_data.get("Negative prompt", ""),
            "seed": meta_data.get("Seed", ""),
            "size": meta_data.get("Size", ""),
            "model": meta_data.get("Model", ""),
            "sampler": meta_data.get("Sampler", ""),
            "steps": meta_data.get("Steps", ""),
            "cfg_scale": meta_data.get("CFG scale", ""),
            "resources": meta_data.get("Resources", ""),
            "model_hash": meta_data.get("Model hash", "")
        })

    return data

def start_conversion():
    folder_path = filedialog.askdirectory()
    if not folder_path:
        return

    filepath_var.set(folder_path)
    if conversion_mode.get() == "one-to-one":
        convert_one_to_one(folder_path)
    else:
        convert_many_to_one(folder_path)

def convert_one_to_one(folder_path):
    html_files = []

    for root_dir, _, files in os.walk(folder_path):
        for filename in files:
            if filename.endswith((".html", ".htm")):
                html_files.append(os.path.join(root_dir, filename))

    if not html_files:
        messagebox.showinfo("No Files", "No HTML files found.")
        return

    progress_bar["maximum"] = len(html_files)

    for i, file_path in enumerate(html_files):
        filename = os.path.basename(file_path)
        base_name, _ = os.path.splitext(filename)

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                html = f.read()
            json_data = extract_data_from_html(html)

            if json_data:
                output_path = os.path.join(folder_path, base_name + ".json")
                with open(output_path, "w", encoding="utf-8") as jf:
                    json.dump(json_data, jf, indent=4)
                log(f"✅ Saved: {base_name}.json", "success")
            else:
                log(f"⚠️ No data found in {filename}", "info")
        except Exception as e:
            log(f"❌ Error in {filename}: {str(e)}", "error")

        progress_bar["value"] = i + 1
        root.update_idletasks()

    messagebox.showinfo("Done", "✅ One-to-One conversion complete.")

def convert_many_to_one(folder_path):
    html_files = []
    combined_data = []

    for root_dir, _, files in os.walk(folder_path):
        for filename in files:
            if filename.endswith((".html", ".htm")):
                html_files.append(os.path.join(root_dir, filename))

    if not html_files:
        messagebox.showinfo("No Files", "No HTML files found.")
        return

    progress_bar["maximum"] = len(html_files)

    for i, file_path in enumerate(html_files):
        filename = os.path.basename(file_path)

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                html = f.read()
            data = extract_data_from_html(html)
            combined_data.extend(data)
            log(f"✅ Parsed: {filename}", "success")
        except Exception as e:
            log(f"❌ Error in {filename}: {str(e)}", "error")

        progress_bar["value"] = i + 1
        root.update_idletasks()

    if combined_data:
        save_path = filedialog.asksaveasfilename(defaultextension=".json", filetypes=[("JSON files", "*.json")])
        if save_path:
            with open(save_path, "w", encoding="utf-8") as jf:
                json.dump(combined_data, jf, indent=4)
            log(f"✅ Combined JSON saved to:\n{save_path}", "success")
            messagebox.showinfo("Done", f"✅ Combined JSON file created with {len(combined_data)} entries.")

def log(message, tag="info"):
    output_box.insert(tk.END, f"{message}\n", tag)
    output_box.see(tk.END)

def toggle_dark_mode():
    is_dark = dark_mode_var.get()
    bg = "#1e1e1e" if is_dark else "#f0f0f0"
    fg = "#ffffff" if is_dark else "#000000"
    root.config(bg=bg)
    for widget in root.winfo_children():
        try:
            widget.config(bg=bg, fg=fg)
        except:
            pass
    output_box.config(bg="#333333" if is_dark else "#ffffff", fg=fg)

# GUI Setup
root = tk.Tk()
root.title("🧠 HTML to JSON Converter")
root.geometry("720x580")
root.resizable(False, False)

filepath_var = tk.StringVar()
dark_mode_var = tk.BooleanVar()
conversion_mode = tk.StringVar(value="one-to-one")

tk.Label(root, text="📄 HTML → 🧾 JSON", font=("Helvetica", 16, "bold")).pack(pady=10)

# Radio Buttons for Mode Selection
mode_frame = tk.Frame(root)
mode_frame.pack()
tk.Radiobutton(mode_frame, text="📁 One-to-One (each HTML → JSON)", variable=conversion_mode, value="one-to-one").pack(side="left", padx=10)
tk.Radiobutton(mode_frame, text="📂 Many-to-One (combine into one JSON)", variable=conversion_mode, value="many-to-one").pack(side="left", padx=10)

tk.Button(root, text="📂 Select Folder & Convert", command=start_conversion, font=("Arial", 12)).pack(pady=10)
tk.Entry(root, textvariable=filepath_var, width=85, state="readonly", font=("Arial", 10)).pack(pady=5)

progress_bar = ttk.Progressbar(root, orient="horizontal", mode="determinate", length=600)
progress_bar.pack(pady=5)

tk.Checkbutton(root, text="Dark Mode 🌙", variable=dark_mode_var, command=toggle_dark_mode).pack(pady=5)

tk.Label(root, text="Output Log:", font=("Arial", 10, "bold")).pack(anchor="w", padx=20)
output_box = tk.Text(root, height=15, width=90, bg="#ffffff", fg="#000000", wrap="word")
output_box.pack(pady=5)

output_box.tag_config("success", foreground="green")
output_box.tag_config("error", foreground="red")
output_box.tag_config("info", foreground="blue")

root.mainloop()
