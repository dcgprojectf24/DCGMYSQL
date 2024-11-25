import pandas as pd

# Load the CSV file
file1 = "av.csv"  # Replace with your file name
df1 = pd.read_csv(file1, low_memory=False)

# Keep only the first 16 columns (index 0 to 15)
df1 = df1.iloc[:, :16]

# Rename columns as specified
rename_columns = {
    "BIB_ID": "Bib_ID",
    "new title": "Alt_Title",
    "medium": "Medium",
    "TITLE": "Title",
    "creator": "Creator",
    "format": "Reel_Format",
    "NORMALIZED_CALL_NO": "Digital_File_Name",
    "TTPIAavid": "Record_ID",
    "description note": "Description",
    "date / range": "Year_Range"
}

df1.rename(columns=rename_columns, inplace=True)

df1['Medium'] = "AV"

# Specify the columns to combine 
columns = [
    "#", "of", "#.1", "extent"
]

if all(col in df1.columns for col in columns):
    # Combine columns, ignoring empty or NaN values
    df1['Containers_Info'] = df1[columns].apply(
        lambda row: ', '.join(filter(None, row.dropna().astype(str))), axis=1
    )
    df1.drop(columns=columns, inplace=True)

# Delete specified columns
columns_to_delete = ["ttpia reel #"]
df1.drop(columns=[col for col in columns_to_delete if col in df1.columns], inplace=True)

# List of columns to add
columns_to_add = [
    "Author_ID", "Publisher_ID", "Department_Name", "Location", "Evol_Collections",
    "Rights", "Language", "Geo_Location", "Year_Range", "Microfilm_Date", 
    "Containers_Info", "Record_Metadata", "PC_num", "Cabinet", 
    "File_Folder", "Map_num", "Oversize", "Photo",
    "Medium", "Subject"
]

# Add columns to the DataFrame if they don't already exist
for column in columns_to_add:
    if column not in df1.columns:
        df1[column] = None

# Specify the desired column order
column_order = [
    "Record_ID", "Author_ID", "Publisher_ID", "Department_Name", 
    "Digital_File_Name", "Location", "Evol_Collections", "Bib_ID", 
    "Rights", "Title", "Alt_Title", "Creator", "Description", 
    "Language", "Geo_Location", "Year_Range", "Microfilm_Date", 
    "Containers_Info", "Record_Metadata", "PC_num", "Cabinet", 
    "File_Folder", "Map_num", "Oversize", "Photo", "Reel_Format", 
    "Medium", "Subject"
]

# Reorder the columns in the DataFrame
df1 = df1[column_order]

# Save the modified DataFrame
output_file = "avFinal.csv"
df1.to_csv(output_file, index=False)

print(f"Modified data saved to {output_file}.")