import json,re

def normalizeText(value):
    if value is None: return ''
    text = value if isinstance(value,str) else str(value)
    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            text = str(parsed.get('en') or parsed.get('hi') or ' '.join(str(v) for v in parsed.values()))
        elif isinstance(parsed, list):
            text = ' '.join(str(v) for v in parsed)
    except Exception:
        pass
    return re.sub(r'[^a-zA-Z0-9\s]+', ' ', text).strip().lower()

tests = [
    ('Preamble of the Constitution','Preamble of the Constitution'),
    ('Preamble of the Constitution','Preamble of Constitution'),
    ('{"en":"Preamble of the Constitution","hi":"..."}','Preamble of the Constitution'),
    ('{"en":"Preamble of the Constitution"}','Preamble of the Constitution'),
    ('Preamble of Constitution','Preamble of the Constitution'),
    ('Preamble of the Constitution','Preamble of Constitution'),
]
for a,b in tests:
    print(a,'|',b,'|',normalizeText(a)==normalizeText(b),'|',normalizeText(a),'|',normalizeText(b))
