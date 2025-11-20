#!/bin/bash

# Function to convert icon name to kebab-case
to_kebab_case() {
    echo "$1" | sed 's/\([A-Z]\)/-\1/g' | sed 's/^-//' | tr '[:upper:]' '[:lower:]'
}

# Get all files with lucide-react imports
FILES=$(grep -r "from 'lucide-react'" components/ --include="*.tsx" -l)

for file in $FILES; do
    echo "Processing: $file"
    
    # Extract the import line
    import_line=$(grep "from 'lucide-react'" "$file")
    
    # Extract icons between { and }
    icons=$(echo "$import_line" | sed "s/.*{\(.*\)}.*/\1/" | tr ',' '\n' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')
    
    # Build new import statements
    new_imports=""
    while IFS= read -r icon; do
        # Skip empty lines
        [ -z "$icon" ] && continue
        
        # Check if it's an alias (e.g., "Image as ImageIcon")
        if echo "$icon" | grep -q " as "; then
            original=$(echo "$icon" | awk '{print $1}')
            alias=$(echo "$icon" | awk '{print $3}')
            kebab=$(to_kebab_case "$original")
            new_imports="${new_imports}import ${alias} from 'lucide-react/dist/esm/icons/${kebab}';\n"
        else
            kebab=$(to_kebab_case "$icon")
            new_imports="${new_imports}import ${icon} from 'lucide-react/dist/esm/icons/${kebab}';\n"
        fi
    done <<< "$icons"
    
    # Output what we would replace
    echo "Old: $import_line"
    echo -e "New:\n$new_imports"
    echo "---"
done
