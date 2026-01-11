import requests
import sys
from datetime import datetime
import json

class BankingDashboardTester:
    def __init__(self, base_url="https://pyspark-finance-hub.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, validate_func=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)

            print(f"Status Code: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                try:
                    response_data = response.json()
                    print(f"Response received: {type(response_data)}")
                    
                    # Run custom validation if provided
                    if validate_func:
                        validation_result = validate_func(response_data)
                        if not validation_result:
                            success = False
                            print(f"❌ Validation failed for {name}")
                        else:
                            print(f"✅ Validation passed for {name}")
                    
                    if success:
                        self.tests_passed += 1
                        print(f"✅ {name} - PASSED")
                    
                    return success, response_data
                except json.JSONDecodeError:
                    print(f"❌ {name} - Invalid JSON response")
                    self.failed_tests.append(f"{name}: Invalid JSON response")
                    return False, {}
            else:
                print(f"❌ {name} - Expected {expected_status}, got {response.status_code}")
                self.failed_tests.append(f"{name}: Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"Error response: {error_data}")
                except:
                    print(f"Error response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ {name} - Error: {str(e)}")
            self.failed_tests.append(f"{name}: {str(e)}")
            return False, {}

    def validate_dashboard_stats(self, data):
        """Validate dashboard stats structure and values"""
        required_fields = ['total_transactions', 'total_volume', 'active_customers', 
                          'fraud_alerts', 'avg_transaction', 'high_risk_accounts']
        
        for field in required_fields:
            if field not in data:
                print(f"Missing field: {field}")
                return False
            if not isinstance(data[field], (int, float)):
                print(f"Field {field} is not numeric: {data[field]}")
                return False
        
        # Check expected data volumes
        if data['total_transactions'] != 10000:
            print(f"Expected 10000 transactions, got {data['total_transactions']}")
            return False
            
        print(f"Dashboard stats validation: {data}")
        return True

    def validate_transactions(self, data):
        """Validate transactions array"""
        if not isinstance(data, list):
            print("Transactions should be an array")
            return False
        
        if len(data) == 0:
            print("No transactions returned")
            return False
            
        # Check first transaction structure
        transaction = data[0]
        required_fields = ['id', 'customer_id', 'amount', 'transaction_type', 
                          'merchant', 'category', 'timestamp', 'fraud_score', 'location']
        
        for field in required_fields:
            if field not in transaction:
                print(f"Missing transaction field: {field}")
                return False
        
        print(f"Transactions validation: {len(data)} transactions returned")
        return True

    def validate_fraud_alerts(self, data):
        """Validate fraud alerts"""
        if not isinstance(data, list):
            print("Fraud alerts should be an array")
            return False
        
        if len(data) == 0:
            print("No fraud alerts returned")
            return False
            
        # Check that all alerts have fraud_score > 70
        for alert in data:
            if alert.get('fraud_score', 0) <= 70:
                print(f"Fraud alert with score <= 70: {alert.get('fraud_score')}")
                return False
        
        print(f"Fraud alerts validation: {len(data)} alerts with scores > 70")
        return True

    def validate_customers(self, data):
        """Validate customers array"""
        if not isinstance(data, list):
            print("Customers should be an array")
            return False
        
        if len(data) == 0:
            print("No customers returned")
            return False
            
        print(f"Customers validation: {len(data)} customers returned")
        return True

    def validate_cloud_status(self, data):
        """Validate cloud status"""
        required_fields = ['status', 'region', 'uptime', 'last_check']
        
        for field in required_fields:
            if field not in data:
                print(f"Missing cloud status field: {field}")
                return False
        
        if data['status'] not in ['active', 'warning']:
            print(f"Invalid cloud status: {data['status']}")
            return False
            
        print(f"Cloud status validation: {data}")
        return True

def main():
    print("🏦 Banking Analytics Dashboard API Testing")
    print("=" * 50)
    
    tester = BankingDashboardTester()
    
    # Test all API endpoints
    print("\n📊 Testing Dashboard Stats...")
    tester.run_test(
        "Dashboard Stats",
        "GET",
        "api/dashboard/stats",
        200,
        validate_func=tester.validate_dashboard_stats
    )
    
    print("\n💳 Testing Transactions...")
    tester.run_test(
        "Get Transactions",
        "GET", 
        "api/transactions?limit=100",
        200,
        validate_func=tester.validate_transactions
    )
    
    print("\n📈 Testing Transaction Analytics...")
    tester.run_test(
        "Transaction Analytics",
        "GET",
        "api/transactions/analytics", 
        200
    )
    
    print("\n🚨 Testing Fraud Alerts...")
    tester.run_test(
        "Fraud Alerts",
        "GET",
        "api/fraud/alerts",
        200,
        validate_func=tester.validate_fraud_alerts
    )
    
    print("\n👥 Testing Customers...")
    tester.run_test(
        "Get Customers",
        "GET",
        "api/customers?limit=100", 
        200,
        validate_func=tester.validate_customers
    )
    
    print("\n📊 Testing Customer Analytics...")
    tester.run_test(
        "Customer Analytics",
        "GET",
        "api/customers/analytics",
        200
    )
    
    print("\n⚠️ Testing Risk Assessment...")
    tester.run_test(
        "Risk Assessment",
        "GET",
        "api/risk/assessment",
        200
    )
    
    print("\n☁️ Testing Cloud Status...")
    tester.run_test(
        "Cloud Status",
        "GET", 
        "api/cloud/status",
        200,
        validate_func=tester.validate_cloud_status
    )
    
    print("\n⚡ Testing Spark Jobs...")
    tester.run_test(
        "Get Spark Jobs",
        "GET",
        "api/spark/jobs",
        200
    )
    
    print("\n🔥 Testing Spark Job Trigger...")
    tester.run_test(
        "Trigger Spark Job",
        "POST",
        "api/spark/jobs/trigger?job_name=Test_Job",
        200
    )
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 FINAL RESULTS")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    
    if tester.failed_tests:
        print(f"\n❌ FAILED TESTS:")
        for failed_test in tester.failed_tests:
            print(f"  - {failed_test}")
    else:
        print(f"\n✅ ALL TESTS PASSED!")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())