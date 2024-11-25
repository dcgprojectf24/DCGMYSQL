import pandas as pd

# Load CSV files into DataFrames
file1 = "file1.csv"  # Replace with your file names
file2 = "file2.csv"
file3 = "file3.csv"

df1 = pd.read_csv(file1)
df2 = pd.read_csv(file2)
df3 = pd.read_csv(file3)

# Merge the files on a common column
# Replace 'common_column' with the actual column name shared by all files
merged_df = df1.merge(df2, on='common_column').merge(df3, on='common_column')

# Save the merged data to a new CSV file
output_file = "combined.csv"
merged_df.to_csv(output_file, index=False)

print(f"Files have been combined and saved to {output_file}.")
