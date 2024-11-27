# Load the CSV file
file1 = "avFinal.csv"  # Replace with your file name
df1 = pd.read_csv(file1, low_memory=False)
file2 = "recsFinal.csv"  # Replace with your file name
df2 = pd.read_csv(file2, low_memory=False)

are_indexes_equal = df1.iloc[0].index.equals(df2.iloc[0].index)

if are_indexes_equal:
    print("The indexes of the first rows in both DataFrames are equal.")
else:
    print("The indexes of the first rows in both DataFrames are not equal.")