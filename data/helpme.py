import pandas as pd

# Load the CSV files with low_memory=False to suppress the warning
recs_df = pd.read_csv("recsFinal.csv", low_memory=False)
maps_df = pd.read_csv("mapsFinal.csv", low_memory=False)
av_df = pd.read_csv("avFinal.csv", low_memory=False)

# Stack the DataFrames
combined_df = pd.concat([recs_df, maps_df, av_df], ignore_index=True)

# Generate unique Record_IDs for each row in combined_df
combined_df['Record_ID'] = ['TTPIAid_{:06d}'.format(i) for i in range(len(combined_df))]

# Duplicate the contents of 'Department_Name' into 'Author_ID' and 'Publisher_ID'
combined_df['Author_ID'] = combined_df['Department_Name']
combined_df['Publisher_ID'] = combined_df['Department_Name']

# Save the updated DataFrame to verify changes
output_file = "table.csv"
combined_df.to_csv(output_file, index=False)

print(f"Data combined, updated, and saved to {output_file}.")