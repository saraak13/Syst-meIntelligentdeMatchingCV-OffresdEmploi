import os
import re

src_dir = r"c:\Users\USER\Desktop\S8\PFA\recruitment-platform\src"

replacements = {
    # Text colors
    r'\btext-white\b': 'text-slate-900',
    r'\btext-white/90\b': 'text-slate-800',
    r'\btext-white/80\b': 'text-slate-700',
    r'\btext-white/70\b': 'text-slate-600',
    r'\btext-white/60\b': 'text-slate-500',
    r'\btext-white/50\b': 'text-slate-500',
    r'\btext-white/40\b': 'text-slate-500',
    r'\btext-white/30\b': 'text-slate-400',
    r'\btext-white/20\b': 'text-slate-300',
    r'\btext-white/10\b': 'text-slate-200',
    
    # Backgrounds
    r'\bbg-slate-950\b': 'bg-white',
    r'\bbg-slate-900\b': 'bg-slate-50',
    r'\bbg-slate-800\b': 'bg-slate-100',
    r'\bbg-slate-950/80\b': 'bg-white/80',
    r'\bbg-slate-950/50\b': 'bg-white/50',
    r'\bbg-white/5\b': 'bg-slate-50',
    r'\bbg-white/10\b': 'bg-slate-100',
    r'\bbg-white/20\b': 'bg-slate-200',
    
    # Borders
    r'\bborder-white/5\b': 'border-slate-100',
    r'\bborder-white/8\b': 'border-slate-200',
    r'\bborder-white/10\b': 'border-slate-200',
    r'\bborder-white/20\b': 'border-slate-300',
    r'\bborder-white/30\b': 'border-slate-300',
    r'\bborder-white/40\b': 'border-slate-400',
    
    # Ring
    r'\bring-white/10\b': 'ring-slate-200',
    r'\bring-white/20\b': 'ring-slate-300',

    # Hover text
    r'\bhover:text-white\b': 'hover:text-slate-900',
    r'\bhover:text-white/80\b': 'hover:text-slate-700',

    # Hover bg
    r'\bhover:bg-white/5\b': 'hover:bg-slate-50',
    r'\bhover:bg-white/10\b': 'hover:bg-slate-100',
}

for root, _, files in os.walk(src_dir):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            for pattern, replacement in replacements.items():
                new_content = re.sub(pattern, replacement, new_content)
                
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated: {filepath}")

print("Done")
