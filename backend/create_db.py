import psycopg
from psycopg.errors import DuplicateDatabase

try:
    # Connect to the default postgres database to issue CREATE DATABASE
    conn = psycopg.connect('postgres://postgres:Rudra%40005@localhost:5432/postgres', autocommit=True)
    conn.execute('CREATE DATABASE "Odoo-Hackathon"')
    print("Database 'Odoo-Hackathon' created successfully!")
except DuplicateDatabase:
    print("Database 'Odoo-Hackathon' already exists.")
except Exception as e:
    print(f"Error: {e}")
