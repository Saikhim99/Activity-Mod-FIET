import urllib
import pyodbc

SERVER = r'.\SQLEXPRESS'
DATABASE = 'Activity Mod FIET'
connection_string = f"Driver={{ODBC Driver 17 for SQL Server}};Server={SERVER};Database={DATABASE};Trusted_Connection=yes;"

try:
    conn = pyodbc.connect(connection_string)
    cursor = conn.cursor()
    print("Columns in StudentUser:")
    for row in cursor.columns(table='StudentUser'):
        print(f"- {row.column_name} ({row.type_name})")
    
    print("\nColumns in TeacherUser:")
    for row in cursor.columns(table='TeacherUser'):
        print(f"- {row.column_name} ({row.type_name})")
    
    conn.close()
except Exception as e:
    print(f"Error: {e}")
