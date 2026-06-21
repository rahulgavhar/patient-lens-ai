import os
import psycopg2
from psycopg2.extras import RealDictCursor
from loguru import logger
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://admin_user:password@postgres:5432/ai-service-db"
)

def get_connection():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        return None

def init_db():
    conn = get_connection()
    if not conn:
        logger.warning("Skipping DB initialization due to missing connection.")
        return
    try:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS chat_history (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(100) NOT NULL DEFAULT 'default',
                    question TEXT NOT NULL,
                    answer TEXT NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            cur.execute("""
                ALTER TABLE chat_history ADD COLUMN IF NOT EXISTS username VARCHAR(100) NOT NULL DEFAULT 'default';
            """)
            conn.commit()
            logger.info("Database initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
    finally:
        conn.close()

def save_chat(username: str, question: str, answer: str):
    conn = get_connection()
    if not conn:
        return
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO chat_history (username, question, answer) VALUES (%s, %s, %s);",
                (username, question, answer)
            )
            conn.commit()
            logger.info(f"Chat saved successfully for user: {username}")
    except Exception as e:
        logger.error(f"Failed to save chat: {e}")
    finally:
        conn.close()

def get_chat_history(username: str):
    conn = get_connection()
    if not conn:
        return []
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT id, question, answer, timestamp::text FROM chat_history WHERE username = %s ORDER BY timestamp ASC;",
                (username,)
            )
            rows = cur.fetchall()
            return rows
    except Exception as e:
        logger.error(f"Failed to fetch chat history: {e}")
        return []
    finally:
        conn.close()

# Initialize DB on load
init_db()
