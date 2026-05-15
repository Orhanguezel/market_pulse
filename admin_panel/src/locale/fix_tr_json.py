import json
import re

path = 'admin_panel/src/locale/tr.json'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Try to find all "db": { and their matching braces to separate blocks
# Actually, let's just find the last valid JSON object in the file or reconstruct it

# Remove everything before the first root key "db"
start = content.find('"db":')
if start != -1:
    content = '{\n' + content[start:]

# Ensure it ends with exactly one }
content = content.strip()
while content.count('{') < content.count('}'):
    content = content.rsplit('}', 1)[0].strip()
while content.count('{') > content.count('}'):
    content += '\n}'

# Try to parse and fix commas
try:
    data = json.loads(content)
except json.JSONDecodeError:
    # If still failing, try a very aggressive fix: remove trailing commas before } or ]
    content = re.sub(r',\s*([}\]])', r'\1', content)
    try:
        data = json.loads(content)
    except json.JSONDecodeError as e:
        print(f"Aggressive fix failed: {e}")
        sys.exit(1)

with open(path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print("JSON fixed and formatted.")
