import pandas as pd

# Load the CSV file
file1 = "map.csv"  # Replace with your file name
df1 = pd.read_csv(file1, low_memory=False)

df1['File_Folder'] = None

# Rename columns as specified
rename_columns = {
    "BibID": "Bib_ID",
    "title of file separated from": "Alt_Title",
    "Computer #": "PC_num",
    "Reel & Frame": "Reel_Format",
    "photographs": "Photo",
    "Map title": "Title",
    "creator": "Creator",
    "eVols collection": "Evol_Collections",
    "digital file name": "Digital_File_Name",
    "TTPIAmapid": "Record_ID",
    "Series (eVols Collection)": "Department_Name",
    "oversize": "Oversize",
    "maps": "Map_num",
    "subject": "Subject",
    "language code": "Language",
    "metadata note": "Record_Metadata",
    "date of microfilm": "Microfilm_Date",
    "cabinet(drawer)": "Cabinet",
    "extent": "Containers_Info"
}

df1.rename(columns=rename_columns, inplace=True)

# Specify the columns to concatenate into "Concatenated_Locations"
columns_to_concat = [
    "location: print box list", "location: print separated",
    "location: micro reel list", "location: e-micro"
]

if all(col in df1.columns for col in columns_to_concat):
    # Concatenate columns into "Concatenated_Locations", ignoring empty or NaN values
    df1['Location'] = df1[columns_to_concat].apply(
        lambda row: ', '.join(filter(None, row.dropna().astype(str))), axis=1
    )
    df1.drop(columns=columns_to_concat, inplace=True)

# Combine Description-related columns into "Combined_Description"
description_columns = ["Description, basic", "description of separated contents"]

if all(col in df1.columns for col in description_columns):
    # Combine columns into "Combined_Description", ignoring empty or NaN values
    df1['Description'] = df1[description_columns].apply(
        lambda row: '. '.join(filter(None, row.dropna().astype(str))), axis=1
    )
    # Drop the original columns after combining
    df1.drop(columns=description_columns, inplace=True)

# Specify the columns to combine into "Geo_Location"
geo_columns = [
    "Pacific Islands (Trust Territory)", "Northern Mariana Islands", "Guam", 
    "Palau", "Yap", "Chuuk", "Pohnpei", "Kosrae", 
    "Marshall Islands", "other geo"
]

if all(col in df1.columns for col in geo_columns):
    # Combine columns into "Geo_Location", ignoring empty or NaN values
    df1['Geo_Location'] = df1[geo_columns].apply(
        lambda row: ', '.join(filter(None, row.dropna().astype(str))), axis=1
    )
    df1.drop(columns=geo_columns, inplace=True)

# Combine start year and end year into "Year_Range"
if "start yr" in df1.columns and "end yr" in df1.columns:
    df1['Year_Range'] = df1.apply(
        lambda row: f"{row['start yr']}-{row['end yr']}"
        if pd.notnull(row['start yr']) and pd.notnull(row['end yr']) else None,
        axis=1
    )

# Delete specified columns
columns_to_delete = ["X of X", "container type", "# of containers", "archival level", "publications", "combined geo", "start yr", "end yr", "verified", "archives forms", "format", "format note", "Unnamed: 17", "link", "Has Version", "OCLC Is Version Of", "Digital specifications"]
df1.drop(columns=[col for col in columns_to_delete if col in df1.columns], inplace=True)

# Remove the second row (index 1 since Python uses 0-based indexing)
df1 = df1.drop(index=0)

df1['Publisher_ID'] = None
df1['Author_ID'] = None
df1['Medium'] = "Map"

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

# Keep only rows from index
df1 = df1.iloc[:738]

# Save the modified DataFrame
output_file = "mapsFinal.csv"
df1.to_csv(output_file, index=False)

print(f"Modified data saved to {output_file}.")