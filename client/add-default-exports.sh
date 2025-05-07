#!/bin/bash
# Save this as add-default-exports.sh

FILES=$(grep -l "export const\|export function\|export interface" --include="*.ts" --include="*.tsx" -r ./app)

for file in $FILES; do
  # Check if there's already a default export
  if ! grep -q "export default" "$file"; then
    # Extract the main export name
    export_name=$(basename "$file" | sed 's/\.[^.]*$//')
    
    # Add default export at the end of the file
    echo -e "\nexport default $export_name;" >> "$file"
    echo "Added default export to $file"
  fi
done