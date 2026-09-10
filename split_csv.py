import csv
import os
import sys

csv.field_size_limit(sys.maxsize)

input_file = 'public/hazine.csv'
output_dir = 'public'

file_handles = {}
writers = {}

try:
    with open(input_file, 'r', encoding='utf-8-sig') as f:
        # Use csv reader
        reader = csv.reader(f, delimiter=';')
        
        try:
            header = next(reader)
        except StopIteration:
            header = None
            
        if header:
            # find index of 'ilad'
            ilad_idx = -1
            for i, col in enumerate(header):
                if 'ilad' in col.lower():
                    ilad_idx = i
                    break
            
            if ilad_idx == -1:
                print("Error: 'ilad' column not found in header:", header)
                exit(1)
                
            print(f"Found 'ilad' at index {ilad_idx}")
            
            count = 0
            for row in reader:
                if len(row) <= ilad_idx:
                    continue
                city = row[ilad_idx].strip()
                # sanitize city name for filename
                city_clean = "".join(c for c in city if c.isalnum() or c in (' ', '_', '-')).replace(' ', '_')
                
                if not city_clean:
                    city_clean = "Bilinmeyen"
                    
                if city_clean not in writers:
                    out_path = os.path.join(output_dir, f'hazine_{city_clean}.csv')
                    out_f = open(out_path, 'w', encoding='utf-8', newline='')
                    # Use exact same dialect
                    writer = csv.writer(out_f, delimiter=';', quoting=csv.QUOTE_MINIMAL)
                    writer.writerow(header)
                    file_handles[city_clean] = out_f
                    writers[city_clean] = writer
                
                writers[city_clean].writerow(row)
                count += 1
                if count % 10000 == 0:
                    print(f"Processed {count} rows...")
                    
            print(f"Finished processing {count} rows. Created {len(writers)} files.")
finally:
    for f in file_handles.values():
        f.close()

# Remove original file if successful
if count > 0 and len(writers) > 0:
    print(f"Removing original file {input_file}...")
    os.remove(input_file)
