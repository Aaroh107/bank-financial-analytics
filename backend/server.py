from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import random
import sqlite3
import pandas as pd
import threading
import time

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# SQLite setup
DB_PATH = ROOT_DIR / 'banking_data.db'

# Spark is available but not initialized at startup (requires Java)
spark = None

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    customer_id: str
    amount: float
    transaction_type: str
    merchant: str
    category: str
    timestamp: str
    fraud_score: float
    location: str

class Customer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    email: str
    account_balance: float
    risk_level: str
    segment: str
    join_date: str

class DashboardStats(BaseModel):
    total_transactions: int
    total_volume: float
    active_customers: int
    fraud_alerts: int
    avg_transaction: float
    high_risk_accounts: int

class CloudStatus(BaseModel):
    status: str
    region: str
    uptime: float
    last_check: str

class SparkJob(BaseModel):
    job_id: str
    job_name: str
    status: str
    progress: float
    started_at: str
    duration: Optional[float] = None

class FraudAlert(BaseModel):
    transaction_id: str
    customer_id: str
    amount: float
    fraud_score: float
    reason: str
    timestamp: str
    status: str

# Initialize database
def init_database():
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    
    # Create transactions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            customer_id TEXT,
            amount REAL,
            transaction_type TEXT,
            merchant TEXT,
            category TEXT,
            timestamp TEXT,
            fraud_score REAL,
            location TEXT
        )
    ''')
    
    # Create customers table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS customers (
            id TEXT PRIMARY KEY,
            name TEXT,
            email TEXT,
            account_balance REAL,
            risk_level TEXT,
            segment TEXT,
            join_date TEXT
        )
    ''')
    
    conn.commit()
    
    # Check if data exists
    cursor.execute('SELECT COUNT(*) FROM transactions')
    if cursor.fetchone()[0] == 0:
        generate_mock_data(conn)
    
    conn.close()

def generate_mock_data(conn):
    cursor = conn.cursor()
    
    # Generate customers
    customers = []
    segments = ['Premium', 'Standard', 'Basic']
    risk_levels = ['Low', 'Medium', 'High']
    
    for i in range(500):
        customer = (
            f'CUST{str(i+1).zfill(6)}',
            f'Customer {i+1}',
            f'customer{i+1}@example.com',
            round(random.uniform(1000, 500000), 2),
            random.choice(risk_levels),
            random.choice(segments),
            (datetime.now(timezone.utc) - timedelta(days=random.randint(30, 730))).isoformat()
        )
        customers.append(customer)
    
    cursor.executemany('INSERT INTO customers VALUES (?,?,?,?,?,?,?)', customers)
    
    # Generate transactions
    transactions = []
    categories = ['Food', 'Shopping', 'Travel', 'Bills', 'Entertainment', 'Healthcare', 'Education']
    transaction_types = ['debit', 'credit']
    merchants = ['Amazon', 'Walmart', 'Airlines', 'Hotels', 'Restaurants', 'Gas Stations', 'Online Stores']
    locations = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami', 'Seattle', 'Boston']
    
    for i in range(10000):
        transaction = (
            f'TXN{str(i+1).zfill(8)}',
            f'CUST{str(random.randint(1, 500)).zfill(6)}',
            round(random.uniform(10, 5000), 2),
            random.choice(transaction_types),
            random.choice(merchants),
            random.choice(categories),
            (datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 720))).isoformat(),
            round(random.uniform(0, 100), 2),
            random.choice(locations)
        )
        transactions.append(transaction)
    
    cursor.executemany('INSERT INTO transactions VALUES (?,?,?,?,?,?,?,?,?)', transactions)
    conn.commit()

# Cloud detection simulation
cloud_status_data = {
    'status': 'active',
    'region': 'us-east-1',
    'uptime': 99.98,
    'last_check': datetime.now(timezone.utc).isoformat()
}

# Spark jobs simulation
active_spark_jobs = []

def simulate_spark_job():
    job = {
        'job_id': f'job_{uuid.uuid4().hex[:8]}',
        'job_name': random.choice(['Transaction Aggregation', 'Fraud Detection', 'Customer Segmentation', 'Risk Analysis']),
        'status': 'running',
        'progress': 0.0,
        'started_at': datetime.now(timezone.utc).isoformat(),
        'duration': None
    }
    active_spark_jobs.append(job)
    
    # Simulate job progress
    for i in range(10):
        time.sleep(1)
        job['progress'] = min(100, (i + 1) * 10)
    
    job['status'] = 'completed'
    job['duration'] = 10.0

# API Routes
@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    
    cursor.execute('SELECT COUNT(*) FROM transactions')
    total_transactions = cursor.fetchone()[0]
    
    cursor.execute('SELECT SUM(amount) FROM transactions WHERE transaction_type = "debit"')
    total_volume = cursor.fetchone()[0] or 0
    
    cursor.execute('SELECT COUNT(DISTINCT customer_id) FROM transactions')
    active_customers = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM transactions WHERE fraud_score > 70')
    fraud_alerts = cursor.fetchone()[0]
    
    cursor.execute('SELECT AVG(amount) FROM transactions')
    avg_transaction = cursor.fetchone()[0] or 0
    
    cursor.execute('SELECT COUNT(*) FROM customers WHERE risk_level = "High"')
    high_risk_accounts = cursor.fetchone()[0]
    
    conn.close()
    
    return DashboardStats(
        total_transactions=total_transactions,
        total_volume=round(total_volume, 2),
        active_customers=active_customers,
        fraud_alerts=fraud_alerts,
        avg_transaction=round(avg_transaction, 2),
        high_risk_accounts=high_risk_accounts
    )

@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions(limit: int = 100):
    conn = sqlite3.connect(str(DB_PATH))
    df = pd.read_sql_query(f'SELECT * FROM transactions ORDER BY timestamp DESC LIMIT {limit}', conn)
    conn.close()
    return df.to_dict('records')

@api_router.get("/transactions/analytics")
async def get_transaction_analytics():
    conn = sqlite3.connect(str(DB_PATH))
    
    # Daily transaction volume
    cursor = conn.cursor()
    cursor.execute('''
        SELECT DATE(timestamp) as date, COUNT(*) as count, SUM(amount) as volume
        FROM transactions
        WHERE timestamp >= datetime('now', '-30 days')
        GROUP BY DATE(timestamp)
        ORDER BY date
    ''')
    daily_data = [{'date': row[0], 'count': row[1], 'volume': round(row[2], 2)} for row in cursor.fetchall()]
    
    # Category breakdown
    cursor.execute('''
        SELECT category, COUNT(*) as count, SUM(amount) as volume
        FROM transactions
        GROUP BY category
        ORDER BY volume DESC
    ''')
    category_data = [{'category': row[0], 'count': row[1], 'volume': round(row[2], 2)} for row in cursor.fetchall()]
    
    conn.close()
    
    return {
        'daily_trends': daily_data,
        'category_breakdown': category_data
    }

@api_router.get("/fraud/alerts", response_model=List[FraudAlert])
async def get_fraud_alerts():
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, customer_id, amount, fraud_score, category, timestamp
        FROM transactions
        WHERE fraud_score > 70
        ORDER BY fraud_score DESC
        LIMIT 50
    ''')
    
    alerts = []
    for row in cursor.fetchall():
        alerts.append(FraudAlert(
            transaction_id=row[0],
            customer_id=row[1],
            amount=row[2],
            fraud_score=row[3],
            reason=f'Unusual {row[4]} transaction pattern detected',
            timestamp=row[5],
            status='pending'
        ))
    
    conn.close()
    return alerts

@api_router.get("/customers", response_model=List[Customer])
async def get_customers(limit: int = 100):
    conn = sqlite3.connect(str(DB_PATH))
    df = pd.read_sql_query(f'SELECT * FROM customers LIMIT {limit}', conn)
    conn.close()
    return df.to_dict('records')

@api_router.get("/customers/analytics")
async def get_customer_analytics():
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    
    # Segment distribution
    cursor.execute('''
        SELECT segment, COUNT(*) as count, AVG(account_balance) as avg_balance
        FROM customers
        GROUP BY segment
    ''')
    segment_data = [{'segment': row[0], 'count': row[1], 'avg_balance': round(row[2], 2)} for row in cursor.fetchall()]
    
    # Risk distribution
    cursor.execute('''
        SELECT risk_level, COUNT(*) as count
        FROM customers
        GROUP BY risk_level
    ''')
    risk_data = [{'risk_level': row[0], 'count': row[1]} for row in cursor.fetchall()]
    
    conn.close()
    
    return {
        'segment_distribution': segment_data,
        'risk_distribution': risk_data
    }

@api_router.get("/risk/assessment")
async def get_risk_assessment():
    conn = sqlite3.connect(str(DB_PATH))
    
    # Use PySpark for risk calculation
    df = spark.read.format('jdbc').options(
        url=f'jdbc:sqlite:{DB_PATH}',
        dbtable='customers',
        driver='org.sqlite.JDBC'
    ).load() if False else None  # Simplified for demo
    
    cursor = conn.cursor()
    cursor.execute('''
        SELECT 
            c.risk_level,
            COUNT(DISTINCT t.id) as transaction_count,
            AVG(t.fraud_score) as avg_fraud_score,
            SUM(t.amount) as total_amount
        FROM customers c
        LEFT JOIN transactions t ON c.id = t.customer_id
        GROUP BY c.risk_level
    ''')
    
    risk_data = [{
        'risk_level': row[0],
        'transaction_count': row[1],
        'avg_fraud_score': round(row[2], 2) if row[2] else 0,
        'total_amount': round(row[3], 2) if row[3] else 0
    } for row in cursor.fetchall()]
    
    conn.close()
    return {'risk_metrics': risk_data}

@api_router.get("/cloud/status", response_model=CloudStatus)
async def get_cloud_status():
    # Simulate cloud detection
    cloud_status_data['last_check'] = datetime.now(timezone.utc).isoformat()
    cloud_status_data['uptime'] = round(random.uniform(99.5, 99.99), 2)
    cloud_status_data['status'] = random.choice(['active', 'active', 'active', 'warning'])  # Mostly active
    
    return CloudStatus(**cloud_status_data)

@api_router.get("/spark/jobs", response_model=List[SparkJob])
async def get_spark_jobs():
    # Start a new job occasionally
    if random.random() < 0.3 and len(active_spark_jobs) < 3:
        threading.Thread(target=simulate_spark_job, daemon=True).start()
    
    return [SparkJob(**job) for job in active_spark_jobs[-10:]]

@api_router.post("/spark/jobs/trigger")
async def trigger_spark_job(job_name: str):
    threading.Thread(target=simulate_spark_job, daemon=True).start()
    return {'message': f'Spark job "{job_name}" triggered successfully'}

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_database()
    logger.info("Database initialized")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    spark.stop()